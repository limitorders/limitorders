// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.6;

import "./IERC20.sol";

struct GridOrder {
	uint64 priceBaseLo;
	uint64 priceBaseHi;
	uint16 priceTickLo;
	uint16 priceTickHi;

	uint32 indexInSellList;
	uint32 indexInBuyList;
	uint96 stockAmount;
	uint96 moneyAmount;
}

interface IFeeTo {
	function feeTo() external returns (address);
}

abstract contract LimitOrdersLogicBase {
	address public stock;
	address public money;
	uint public priceAdjust_factory;
	uint constant FeeRate = 2;

	mapping(address => uint[]) private userOrderIdLists;
	uint public pendingReward;

	uint constant TICK_COUNT = 7900;
	uint constant MASK_WORD_COUNT = (TICK_COUNT+255)/256;
	uint[MASK_WORD_COUNT] private sellOrderMaskWords;
	uint[MASK_WORD_COUNT] private buyOrderMaskWords;
	uint[][TICK_COUNT] private sellOrderIdLists;
	uint[][TICK_COUNT] private buyOrderIdLists;

	address constant SEP206Contract = address(bytes20(uint160(0x2711)));

	// alpha = 1.0069555500567189 = 2**0.01;   alpha**100 = 2
	// 0x40000/0.0069555500567189 = 37688464
	// for i in range(10): print((1<<24)*(alpha**i))
	uint constant BASE = 37688464;
	uint constant X = (uint(16777216)<<(0*25))| //alpha*0
	                  (uint(16893910)<<(1*25))| //alpha*1
	                  (uint(17011417)<<(2*25))| //alpha*2
	                  (uint(17129740)<<(3*25))| //alpha*3
	                  (uint(17248887)<<(4*25))| //alpha*4
	                  (uint(17368863)<<(5*25))| //alpha*5
	                  (uint(17489673)<<(6*25))| //alpha*6
	                  (uint(17611323)<<(7*25))| //alpha*7
	                  (uint(17733819)<<(8*25))| //alpha*8
	                  (uint(17857168)<<(9*25)); //alpha*9

	// for i in range(10): print((1<<24)*(alpha**(i*10)))
	uint constant Y = (uint(16777216)<<(0*25))| //alpha*0
	                  (uint(17981375)<<(1*25))| //alpha*10
	                  (uint(19271960)<<(2*25))| //alpha*20
	                  (uint(20655176)<<(3*25))| //alpha*30
	                  (uint(22137669)<<(4*25))| //alpha*40
	                  (uint(23726566)<<(5*25))| //alpha*50
	                  (uint(25429504)<<(6*25))| //alpha*60
	                  (uint(27254668)<<(7*25))| //alpha*70
	                  (uint(29210830)<<(8*25))| //alpha*80
	                  (uint(31307392)<<(9*25)); //alpha*90

	uint constant MASK25 = (1<<25)-1;
	uint constant MASK64 = (1<<64)-1;
	uint constant PriceDecimals = 26;

	event CreateGridOrder(address indexed maker, uint packedOrder);
	event DealWithSellOrders(address indexed taker, uint stock_money_time);
	event DealWithBuyOrders(address indexed taker, uint stock_money_time);

	function initPriceAdjust(uint priceAdjust) external {
		require((priceAdjust_factory >> 160) == 0, "already-adjusted");
		priceAdjust_factory |= priceAdjust;
	}

	function getSellOrderMaskWords() view external returns (uint[MASK_WORD_COUNT] memory masks) {
		for(uint i=0; i < masks.length; i++) {
			masks[i] = sellOrderMaskWords[i];
		}
	}

	function getBuyOrderMaskWords() view external returns (uint[MASK_WORD_COUNT] memory masks) {
		for(uint i=0; i < masks.length; i++) {
			masks[i] = buyOrderMaskWords[i];
		}
	}

	function orderToArray(GridOrder memory order, uint id) public pure returns (uint[5] memory arr) {
		arr[0] = id;
		arr[1] = uint(order.priceBaseLo)<<(uint(order.priceTickLo)/100);
		arr[2] = uint(order.priceBaseHi)<<(uint(order.priceTickHi)/100);
		arr[3] = order.stockAmount;
		arr[4] = order.moneyAmount;
	}

	function getOrders(uint[] storage orderIdList, uint start, uint end) private returns(uint[5][] memory orders) {
		if(end > orderIdList.length) {
			end = orderIdList.length;
		}
		orders = new uint[5][](end-start);
		for(uint i=start; i<end; i++) {
			uint id = orderIdList[i];
			GridOrder memory order = getGridOrder(id);
			orders[i-start] = orderToArray(order, id);
		}
	}

	function getUserOrders(address user, uint start, uint end) external returns(uint[5][] memory orders) {
		return getOrders(userOrderIdLists[user], start, end);
	}

	function getSellOrders(uint tick, uint start, uint end) external returns(uint[5][] memory orders) {
		return getOrders(sellOrderIdLists[tick], start, end);
	}

	function getBuyOrders(uint tick, uint start, uint end) external returns(uint[5][] memory orders) {
		return getOrders(buyOrderIdLists[tick], start, end);
	}


	// return a number in the range [2.8147497671065605e-12, 2962330055567.072]
	// maximum returned value: 17857168*31307392*(2**79)=fe3b4ed7d40000000000000000000000 < 2**128
	function unpackPrice(uint packedPrice) internal pure returns (uint64 priceBase, uint16 priceTick) {
		priceTick = uint16((packedPrice >> 19) & 0x1FFF); // 13 bits
		uint adjust = packedPrice & 0x7FFFF; // 19 bits
		uint tail = priceTick%100;
		uint beforeAdjust = ((Y>>((tail/10)*25))&MASK25) * ((X>>(tail%10)*25)&MASK25);
		priceBase = uint64(beforeAdjust * (BASE+adjust) / BASE);
	}

	function getGridOrder(uint id) public virtual returns (GridOrder memory order);
	function setGridOrder(uint id, GridOrder memory order) virtual internal;
	function deleteGridOrder(uint id) virtual internal;

	function safeTransfer(address coinType, address receiver, uint amount) internal {
		if(amount == 0) {
			return;
		}
		(bool success, bytes memory data) = coinType.call(
			abi.encodeWithSignature("transfer(address,uint256)", receiver, amount));
		bool ret = abi.decode(data, (bool));
		require(success && ret, "trans-fail");
	}

	function safeReceive(address coinType, uint msgValue, uint amount, bool bchExclusive) internal returns (uint96, uint) {
		if(amount == 0) {
			return (0, msgValue);
		}
		uint realAmount = amount;
		if(coinType == SEP206Contract) {
			require(msgValue >= amount, "value-mismatch");
			msgValue -= amount;
		} else {
			require(!bchExclusive || msg.value == 0, "dont-send-bch");
			uint oldBalance = IERC20(coinType).balanceOf(address(this));
			IERC20(coinType).transferFrom(msg.sender, address(this), uint(amount));
			uint newBalance = IERC20(coinType).balanceOf(address(this));
			realAmount = uint96(newBalance - oldBalance);
		}
		return (uint96(realAmount), msgValue);
	}
	
	// =============================================================
	
	function createGridOrders(uint[] calldata packedOrders) external payable {
		uint msgValue = msg.value;
		for(uint i=0; i<packedOrders.length; i++) {
			msgValue = _createGridOrder(packedOrders[i], msgValue, i);
		}
		require(msgValue == 0, "value-mismatch");
	}

	function createGridOrder(uint packedOrder) external payable {
		uint remainedValue = _createGridOrder(packedOrder, msg.value, 0);
		require(remainedValue == 0, "value-mismatch");
	}

	function _createGridOrder(uint packedOrder, uint msgValue, uint i) private returns (uint) {
		uint packedPriceLo = uint32(packedOrder >> 0);
		uint packedPriceHi = uint32(packedOrder >> 32);
		require(packedPriceHi > packedPriceLo, "Hi<=Lo");
		require(packedPriceLo != 0, "zero-price-tick");

		GridOrder memory order;
		(order.priceBaseLo, order.priceTickLo) = unpackPrice(packedPriceLo);
		(order.priceBaseHi, order.priceTickHi) = unpackPrice(packedPriceHi);
		order.stockAmount = uint96(packedOrder >> 64);
		order.moneyAmount = uint96(packedOrder >> (64+96));
		require(order.stockAmount != 0 || order.moneyAmount != 0, "zero-amount");
		bool bchExclusive = stock != SEP206Contract && money != SEP206Contract;
		(order.stockAmount, msgValue) = safeReceive(stock, msgValue, order.stockAmount, bchExclusive);
		(order.moneyAmount, msgValue) = safeReceive(money, msgValue, order.moneyAmount, bchExclusive);

		uint orderId = (uint(uint160(bytes20(msg.sender)))<<96)|(uint(block.number)<<32)|i;
		while(getGridOrder(orderId).priceBaseHi != 0) {
			orderId++;
		}
		uint[] storage userOrderIdList = userOrderIdLists[msg.sender];
		userOrderIdList.push(orderId);

		uint[] storage sellOrderIdList = sellOrderIdLists[order.priceTickHi];
		uint[] storage buyOrderIdList = buyOrderIdLists[order.priceTickLo];
		order.indexInSellList = uint32(sellOrderIdList.length);
		order.indexInBuyList = uint32(buyOrderIdList.length);
		setGridOrder(orderId, order);
		sellOrderIdList.push(orderId);
		buyOrderIdList.push(orderId);

		if(sellOrderIdList.length == 1) {
			(uint wordIdx, uint bitIdx) = (order.priceTickHi/256, order.priceTickHi%256);
			sellOrderMaskWords[wordIdx] |= (uint(1)<<bitIdx); // set bit
		}
		if(buyOrderIdList.length == 1) {
			(uint wordIdx, uint bitIdx) = (order.priceTickLo/256, order.priceTickLo%256);
			buyOrderMaskWords[wordIdx] |= (uint(1)<<bitIdx); // set bit
		}
		emit CreateGridOrder(msg.sender, packedOrder);
		return msgValue;
	}

	function cancelGridOrders(uint[] calldata uint32List) public {
		uint mask = 0xFFFFFFFF;
		for(uint i=0; i<uint32List.length; i++) {
			for(uint j=0; j<256; j+=32) {
				uint idx = (uint32List[i]>>j)&mask;
				if(idx == mask) {
					return;
				}
				cancelGridOrder(idx);
			}
		}
	}

	function cancelGridOrder(uint userIdx) public {
		uint[] storage userOrderIdList = userOrderIdLists[msg.sender];
		uint orderId = userOrderIdList[userIdx];
		GridOrder memory order = getGridOrder(orderId);
		require(order.priceTickLo != 0, "no-such-order");

		uint[] storage sellOrderIdList = sellOrderIdLists[order.priceTickHi];
		uint[] storage buyOrderIdList = buyOrderIdLists[order.priceTickLo];
		(uint sellIdx, uint buyIdx) = (order.indexInSellList, order.indexInBuyList);
		require(orderId == sellOrderIdList[sellIdx], "wrong-sell-idx");
		require(orderId == buyOrderIdList[buyIdx], "wrong-buy-idx");

		deleteGridOrder(orderId);
		userOrderIdList[userIdx] = userOrderIdList[userOrderIdList.length-1];
		uint last = sellOrderIdList.length-1;
		if(sellIdx != last) {
			uint id = sellOrderIdList[last];
			sellOrderIdList[sellIdx] = id;
			GridOrder memory o = getGridOrder(id);
			o.indexInSellList = uint32(sellIdx);
			setGridOrder(id, o);
		}
		last = buyOrderIdList.length-1;
		if(buyIdx != last) {
			uint id = buyOrderIdList[last];
			buyOrderIdList[buyIdx] = id;
			GridOrder memory o = getGridOrder(id);
			o.indexInBuyList = uint32(buyIdx);
			setGridOrder(id, o);
		}
		userOrderIdList.pop();
		sellOrderIdList.pop();
		buyOrderIdList.pop();

		if(sellOrderIdList.length == 0) {
			(uint wordIdx, uint bitIdx) = (order.priceTickHi/256, order.priceTickHi%256);
			sellOrderMaskWords[wordIdx] &= ~(uint(1)<<bitIdx); // clear bit
		}
		if(buyOrderIdList.length == 0) {
			(uint wordIdx, uint bitIdx) = (order.priceTickLo/256, order.priceTickLo%256);
			buyOrderMaskWords[wordIdx] &= ~(uint(1)<<bitIdx); // clear bit
		}
		safeTransfer(stock, msg.sender, uint(order.stockAmount));
		safeTransfer(money, msg.sender, uint(order.moneyAmount));
	}

	function loadPriceMulDiv() internal view returns (uint priceMul, uint priceDiv) {
		uint priceAdjust = priceAdjust_factory >> 160;
		bool isDiv = (priceAdjust & 1) != 0;
		priceAdjust >>= 1;
		if(isDiv) {
			(priceMul, priceDiv) = (1, priceAdjust);
		} else {
			(priceMul, priceDiv) = (priceAdjust, 1);
		}
	}

	function dealWithSellOrders(uint maxPrice, uint[] calldata orderPosList,
				    uint moneyAmountIn_maxGotStock) external payable {
		uint totalMoneyAmount = moneyAmountIn_maxGotStock>>96;
		uint maxGotStock = uint96(moneyAmountIn_maxGotStock);
		uint fee0; // declar here to avoid "Stack too deep, try removing local variables"
		(totalMoneyAmount, fee0) = safeReceive(money, msg.value, totalMoneyAmount, true);
		fee0 = totalMoneyAmount * FeeRate / 1000;
		uint moneyAmount0 = totalMoneyAmount - fee0;
		uint moneyAmount = moneyAmount0;
		uint gotStock = 0;
		(uint priceMul, uint priceDiv) = loadPriceMulDiv();
		for(uint i=0; i<orderPosList.length; i++) {
			for(uint j=0; j<256-48; j+=48) {
				if(moneyAmount == 0 || gotStock == maxGotStock) {
					break;
				}
				uint48 orderPos = uint48(orderPosList[i]>>j);
				if(orderPos==0) {
					break;
				}
				(moneyAmount, gotStock) = dealWithSellOrder(maxPrice, uint(orderPos), maxGotStock,
								priceMul, priceDiv, moneyAmount, gotStock);
			}
		}
		uint dealMoney = moneyAmount0 - moneyAmount;
		uint fee = fee0 * dealMoney / moneyAmount0;
		safeTransfer(stock, msg.sender, gotStock);
		safeTransfer(money, msg.sender, moneyAmount + fee0 - fee);
		pendingReward += fee;
		uint stock_money_time = (gotStock<<(96+64)) | (dealMoney<<64) | block.timestamp;
		emit DealWithSellOrders(msg.sender, stock_money_time);
	}

	function dealWithSellOrder(uint maxPrice, uint orderPos, uint maxGotStock, uint priceMul, uint priceDiv,
				   uint remainedMoney, uint gotStock) internal returns (uint, uint) {
		uint[] storage sellOrderIdList;
		uint orderId;
		{//Prevent "Stack too deep, try removing local variables."
			(uint priceTick, uint idx) = (uint(orderPos)&0xFFFF, uint(orderPos)>>16);
			sellOrderIdList = sellOrderIdLists[priceTick];
			if(idx >= sellOrderIdList.length) {
				return (remainedMoney, gotStock);
			}
			orderId = sellOrderIdList[idx];
		}
		GridOrder memory gridOrder = getGridOrder(orderId);
		uint price = uint(gridOrder.priceBaseHi)<<(uint(gridOrder.priceTickHi)/100);
		// if(price*priceMul > maxPrice*priceDiv) {
		if(price > maxPrice) {
			return (remainedMoney, gotStock);
		}
		uint moneyAmountOfMaker = price*priceMul*uint(gridOrder.stockAmount)/((10**PriceDecimals)*priceDiv);
		(uint dealMoneyAmount, uint dealStockAmount) = (0, 0);
		if(moneyAmountOfMaker <= remainedMoney) {
			dealMoneyAmount = moneyAmountOfMaker;
			dealStockAmount = gridOrder.stockAmount;
		} else {
			dealMoneyAmount = remainedMoney;
			dealStockAmount = remainedMoney*(10**PriceDecimals)*priceDiv/(price*priceMul);
		}
		uint newGotStock = gotStock + dealStockAmount;
		if(newGotStock > maxGotStock) {
			dealStockAmount = maxGotStock-gotStock;
			dealMoneyAmount = dealStockAmount*price*priceMul/((10**PriceDecimals)*priceDiv);
			newGotStock = maxGotStock;
		}
		gotStock = newGotStock;
		remainedMoney -= dealMoneyAmount;
		gridOrder.stockAmount = uint96(uint(gridOrder.stockAmount) - dealStockAmount);
		gridOrder.moneyAmount = uint96(uint(gridOrder.moneyAmount) + dealMoneyAmount);
		setGridOrder(orderId, gridOrder);
		return (remainedMoney, gotStock);
	}

	function dealWithBuyOrders(uint minPrice, uint[] calldata orderPosList,
				   uint stockAmountIn_maxGotMoney) external payable {
		uint stockAmountIn = stockAmountIn_maxGotMoney>>96;
		uint maxGotMoney = uint96(stockAmountIn_maxGotMoney);
		(uint stockAmount, uint _notUsed) = safeReceive(stock, msg.value, stockAmountIn, true);
		uint stockAmount0 = stockAmount;
		uint gotMoney = 0;
		(uint priceMul, uint priceDiv) = loadPriceMulDiv();
		for(uint i=0; i<orderPosList.length; i++) {
			for(uint j=0; j<256-48; j+=48) {
				if(stockAmount == 0) {
					break;
				}
				uint48 orderPos = uint48(orderPosList[i]>>j);
				if(orderPos==0) {
					break;
				}
				(stockAmount, gotMoney) = dealWithBuyOrder(minPrice, uint(orderPos), maxGotMoney,
								priceMul, priceDiv, stockAmount, gotMoney);
			}
		}
		uint fee = gotMoney * FeeRate / 1000;
		pendingReward += fee;
		safeTransfer(money, msg.sender, gotMoney - fee);
		safeTransfer(stock, msg.sender, stockAmount);
		uint dealStock = stockAmount0 - stockAmount;
		uint stock_money_time = (dealStock<<(96+64)) | (gotMoney<<64) | block.timestamp;
		emit DealWithBuyOrders(msg.sender, stock_money_time);
	}

	function dealWithBuyOrder(uint minPrice, uint orderPos, uint maxGotMoney, uint priceMul, uint priceDiv,
				  uint remainedStock, uint gotMoney) internal returns (uint, uint) {
		uint[] storage buyOrderIdList;
		uint orderId;
		{//Prevent "Stack too deep, try removing local variables."
			(uint priceTick, uint idx) = (uint(orderPos)&0xFFFF, uint(orderPos)>>16);
			buyOrderIdList = buyOrderIdLists[priceTick];
			if(idx >= buyOrderIdList.length) {
				return (remainedStock, gotMoney);
			}
			orderId = buyOrderIdList[idx];
		}
		GridOrder memory gridOrder = getGridOrder(orderId);
		uint price = uint(gridOrder.priceBaseLo)<<(uint(gridOrder.priceTickLo)/100);
		// if(price*priceMul < minPrice*priceDiv) {
		if(price < minPrice) {
			return (remainedStock, gotMoney);
		}
		uint stockAmountOfMaker = uint(gridOrder.moneyAmount)*(10**PriceDecimals)*priceDiv/(price*priceMul);
		(uint dealMoneyAmount, uint dealStockAmount) = (0, 0);
		if(stockAmountOfMaker <= remainedStock) {
			dealMoneyAmount = gridOrder.moneyAmount;
			dealStockAmount = stockAmountOfMaker;
		} else {
			dealMoneyAmount = remainedStock*price*priceMul/((10**PriceDecimals)*priceDiv);
			dealStockAmount = remainedStock;
		}
		uint newGotMoney = gotMoney + dealMoneyAmount;
		if(newGotMoney > maxGotMoney) {
			dealMoneyAmount = maxGotMoney - gotMoney;
			dealStockAmount = dealMoneyAmount*(10**PriceDecimals)*priceDiv/(price*priceMul);
			newGotMoney = maxGotMoney;
		}
		gotMoney = newGotMoney;
		remainedStock -= dealStockAmount;
		gridOrder.stockAmount = uint96(uint(gridOrder.stockAmount) + dealStockAmount);
		gridOrder.moneyAmount = uint96(uint(gridOrder.moneyAmount) - dealMoneyAmount);
		setGridOrder(orderId, gridOrder);
		return (remainedStock, gotMoney);
	}

	function withdrawReward() external {
		address factory = address(bytes20(uint160(priceAdjust_factory)));
		address receiver = IFeeTo(factory).feeTo();
		safeTransfer(money, receiver, pendingReward);
		pendingReward = 0;
	}
}

contract LimitOrdersLogic is LimitOrdersLogicBase {
	mapping(uint => GridOrder) public gridOrders;

	function getGridOrder(uint id) public view override returns (GridOrder memory order) {
		return gridOrders[id];
	}

	function setGridOrder(uint id, GridOrder memory order) override internal {
		gridOrders[id] = order;
	}

	function deleteGridOrder(uint id) override internal {
		delete gridOrders[id];
	}
}

contract LimitOrdersLogicForSmartBCH is LimitOrdersLogicBase {
	address constant SEP101Contract = address(bytes20(uint160(0x2712)));
	
	function getGridOrder(uint id) public override returns (GridOrder memory order) {
		bytes memory idBz = abi.encode(id);
		(bool success, bytes memory data) = SEP101Contract.delegatecall(
			abi.encodeWithSignature("get(bytes)", idBz));

		require(success && (data.length == 32*2 || data.length == 32*4));
		if (data.length == 32*2) {
			order.priceTickLo = 0;
			return order;
		}

		bytes memory vaultBz;
		assembly { vaultBz := add(data, 64) }

		(uint w0, uint w1) = abi.decode(vaultBz, (uint, uint));
		order.priceBaseLo     = uint64(w0>> 96);
		order.priceBaseHi     = uint64(w0>> 32);
		order.priceTickLo     = uint16(w0>> 16);
		order.priceTickHi     = uint16(w0>>  0);
		order.indexInSellList = uint32(w1>>224);
		order.indexInBuyList  = uint32(w1>>192);
		order.stockAmount     = uint96(w1>> 96);
		order.moneyAmount     = uint96(w1>>  0);
	}

	// w0[blank(96)|priceBaseLo(64)|priceBaseHi(64)|priceTickLo(16)|priceTickHi(16)]
	// w1[indexInSellList(32)|indexInBuyList(32)|stockAmount(96)|moneyAmount(96)]
	function setGridOrder(uint id, GridOrder memory order) override internal {
		bytes memory idBz = abi.encode(id);
		(uint w0, uint w1) = (0, 0);
		w0 = uint(order.priceBaseLo);
		w0 = (w0<<64) | uint(order.priceBaseHi);
		w0 = (w0<<16) | uint(order.priceTickLo);
		w0 = (w0<<16) | uint(order.priceTickHi);

		w1 = uint(order.indexInSellList);
		w1 = (w1<<32) | uint(order.indexInBuyList);
		w1 = (w1<<96) | uint(order.stockAmount);
		w1 = (w1<<96) | uint(order.moneyAmount);

		bytes memory vaultBz = abi.encode(w0, w1);
		(bool success, bytes memory _notUsed) = SEP101Contract.delegatecall(
			abi.encodeWithSignature("set(bytes,bytes)", idBz, vaultBz));
		require(success, "SEP101_SET_FAIL");
	}

	function deleteGridOrder(uint id) override internal {
		bytes memory idBz = abi.encode(id);
		bytes memory vaultBz = new bytes(0); //writing zero-length bytes is for deletion
		(bool success, bytes memory _notUsed) = SEP101Contract.delegatecall(
			abi.encodeWithSignature("set(bytes,bytes)", idBz, vaultBz));
		require(success, "SEP101_DEL_FAIL");
	}
}

contract LimitOrdersProxy {
	address public stock;
	address public money;
	uint public priceAdjust_factory;
	uint immutable public implAddr;
	
	constructor(address _stock, address _money, address _impl) {
		stock = _stock;
		money = _money;
		priceAdjust_factory = uint(uint160(bytes20(msg.sender)));
		implAddr = uint(uint160(bytes20(address(_impl))));
	}
	
	receive() external payable {
		require(false);
	}

	fallback() payable external {
		uint impl=implAddr;
		assembly {
			let ptr := mload(0x40)
			calldatacopy(ptr, 0, calldatasize())
			let result := delegatecall(gas(), impl, ptr, calldatasize(), 0, 0)
			let size := returndatasize()
			returndatacopy(ptr, 0, size)
			switch result
			case 0 { revert(ptr, size) }
			default { return(ptr, size) }
		}
	}
}

contract LimitOrdersFactory {
	address constant SEP206Contract = address(bytes20(uint160(0x2711)));

	address public feeToSetter;
	address public newFeeToSetter;
	address public feeTo;

	event Created(address indexed stock, address indexed money, address pairAddr);

	constructor(address _feeTo) {
		feeToSetter = msg.sender;
		newFeeToSetter = msg.sender;
		feeTo = _feeTo;
	}

	function changeFeeToSetter(address _newFeeToSetter) external {
		require(msg.sender == feeToSetter, 'not-feeto-setter');
		newFeeToSetter = _newFeeToSetter;
	}

	function acceptFeeToSetter() external {
		require(msg.sender == newFeeToSetter, 'not-new-feeto-setter');
		feeToSetter = newFeeToSetter;
	}

	function setFeeTo(address _feeTo) external {
		require(msg.sender == feeToSetter, 'not-feeto-setter');
		feeTo = _feeTo;
	}

	function create(address stock, address money, address impl) external {
		address pairAddr = address(new LimitOrdersProxy{salt: 0}(stock, money, impl));
		uint stockDecimals = stock == SEP206Contract ? 18 : IERC20(stock).decimals();
		uint moneyDecimals = money == SEP206Contract ? 18 : IERC20(money).decimals();
		uint priceAdjust;
		if(moneyDecimals >= stockDecimals) {
			priceAdjust = (10**(moneyDecimals - stockDecimals))<<1;
		} else {
			priceAdjust = (10**(stockDecimals - moneyDecimals))<<1;
			priceAdjust |= 1;
		}
		LimitOrdersLogicBase(pairAddr).initPriceAdjust(priceAdjust<<160);
		emit Created(stock, money, pairAddr);
	}
}
