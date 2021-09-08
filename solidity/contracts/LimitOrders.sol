// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./IERC20.sol";

struct GridOrder {
	uint16 priceTickLo;
	uint16 priceTickHi;
	uint96 stockAmount;
	uint96 moneyAmount;
}

interface IFeeTo {
	function feeTo() external returns (address);
}

contract LimitOrdersLogic {
	address public stock;
	address public money;
	address public factory;

	mapping(uint => uint) public gridOrders;
	mapping(address => uint[]) public userOrderIdLists;
	uint public pendingReward;

	uint constant TICK_COUNT = 12800;
	uint[TICK_COUNT/256] public sellOrderMaskWords;
	uint[TICK_COUNT/256] public buyOrderMaskWords;
	uint[][TICK_COUNT] public sellOrderIdLists;
	uint[][TICK_COUNT] public buyOrderIdLists;

	address constant SEP206Contract = address(bytes20(uint160(0x2711)));

	// alpha = 1.0069555500567189 = 2**0.01;   alpha**100 = 2
	// for i in range(10): print((1<<24)*(alpha**i))
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

	uint constant MASK25 = (1<<26)-1;
	uint constant MASK64 = (1<<65)-1;

	event CreateGridOrder(address indexed maker, uint packedOrder);
	event DealWithSellOrders(address indexed taker, uint stockAmount, uint moneyAmount);
	event DealWithBuyOrders(address indexed taker, uint stockAmount, uint moneyAmount);

	function tickToPrice(uint tick) internal pure returns (uint) {
		(uint shift, uint tail) = (tick/100, tick%100);
		uint price = ((Y>>((tail/10)*25))&MASK25) * ((X>>(tail%10)*25)&MASK25);
		return price << shift;
	}

	function getGridOrder(uint id) public view returns (GridOrder memory order) {
		return parsePackedOrder(gridOrders[id]);
	}

	function parsePackedOrder(uint packed) public pure returns (GridOrder memory order) {
		order.priceTickLo = uint16(packed >> 0);
		order.priceTickHi = uint16(packed >> 16);
		order.stockAmount = uint96(packed >> 32);
		order.moneyAmount = uint96(packed >> (32+96));
	}

	function setGridOrder(uint id, GridOrder memory order) internal {
		uint packed = uint(order.moneyAmount);
		packed = (packed<<96) | uint(order.stockAmount);
		packed = (packed<<16) | uint(order.priceTickHi);
		packed = (packed<<16) | uint(order.priceTickLo);
		gridOrders[id] = packed;
	}

	function safeTransfer(address coinType, address receiver, uint amount) internal {
		if(amount == 0) {
			return;
		}
		(bool success, bytes memory data) = coinType.call(
			abi.encodeWithSignature("transfer(address,uint256)", receiver, amount));
		bool ret = abi.decode(data, (bool));
		require(success && ret, "trans-fail");
	}

	function safeReceive(address coinType, address sender, uint amount) internal returns (uint96) {
		if(amount == 0) {
			return 0;
		}
		uint realAmount = amount;
		if(coinType == SEP206Contract) {
			require(msg.value == amount, "value-mismatch");
		} else {
			require(msg.value == 0, "dont-send-bch");
			uint oldBalance = IERC20(coinType).balanceOf(address(this));
			IERC20(coinType).transferFrom(sender, address(this), uint(amount));
			uint newBalance = IERC20(coinType).balanceOf(address(this));
			realAmount = uint96(newBalance - oldBalance);
		}
		return uint96(realAmount);
	}
	
	// =============================================================

	function createGridOrder(uint packedOrder) external payable {
		GridOrder memory order = parsePackedOrder(packedOrder);
		require(order.priceTickHi > order.priceTickLo, "Hi<=Lo");
		require(order.priceTickLo != 0, "zero-price-tick");
		require(order.stockAmount != 0 || order.moneyAmount != 0, "zero-amount");
		order.stockAmount = safeReceive(stock, msg.sender, order.stockAmount);
		order.moneyAmount = safeReceive(money, msg.sender, order.moneyAmount);

		uint orderId = (uint(uint160(bytes20(msg.sender)))<<96)|(uint(block.number)<<32);
		while(gridOrders[orderId] != 0) {
			orderId++;
		}
		setGridOrder(orderId, order);
		uint[] storage userOrderIdList = userOrderIdLists[msg.sender];
		uint[] storage sellOrderIdList = sellOrderIdLists[order.priceTickHi];
		uint[] storage buyOrderIdList = buyOrderIdLists[order.priceTickLo];
		userOrderIdList.push(orderId);
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
	}

	function cancelGridOrder(uint indexes) external {
		uint userIdx = indexes&MASK64;
		uint sellIdx = (indexes>>64)&MASK64;
		uint buyIdx = (indexes>>128)&MASK64;
		uint[] storage userOrderIdList = userOrderIdLists[msg.sender];
		uint orderId = userOrderIdList[userIdx];
		GridOrder memory order = getGridOrder(orderId);
		require(order.priceTickLo != 0, "no-such-order");

		uint[] storage sellOrderIdList = sellOrderIdLists[order.priceTickHi];
		uint[] storage buyOrderIdList = buyOrderIdLists[order.priceTickLo];
		require(orderId == sellOrderIdList[sellIdx], "wrong-sell-idx");
		require(orderId == buyOrderIdList[buyIdx], "wrong-buy-idx");

		delete gridOrders[orderId];
		userOrderIdList[userIdx] = userOrderIdList[userOrderIdList.length-1];
		sellOrderIdList[userIdx] = sellOrderIdList[userOrderIdList.length-1];
		buyOrderIdList[userIdx] = buyOrderIdList[userOrderIdList.length-1];
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

	function dealWithSellOrders(uint[] calldata orderPosList, uint moneyAmountIn) external payable {
		uint totalMoneyAmount = safeReceive(money, msg.sender, moneyAmountIn);
		uint fee0 = totalMoneyAmount * 2 / 1000; // 0.2% fee
		uint moneyAmount0 = totalMoneyAmount - fee0;
		uint moneyAmount = moneyAmount0;
		uint gotStock = 0;
		for(uint i=0; i<orderPosList.length; i++) {
			for(uint j=0; j<256-48; j+=48) {
				if(moneyAmount == 0) {
					break;
				}
				uint48 orderPos = uint48(orderPosList[i]>>j);
				if(orderPos==0) {
					break;
				}
				(moneyAmount, gotStock) = dealWithSellOrder(uint(orderPos), moneyAmount, gotStock);
			}
		}
		uint dealMoney = moneyAmount0 - moneyAmount;
		uint fee = fee0 * dealMoney / moneyAmount0;
		safeTransfer(stock, msg.sender, gotStock);
		safeTransfer(money, msg.sender, moneyAmount + fee0 - fee);
		pendingReward += fee;
		emit DealWithSellOrders(msg.sender, gotStock, dealMoney);
	}

	function dealWithSellOrder(uint orderPos, uint remainedMoney, uint gotStock) internal returns (uint, uint) {
		(uint priceTick, uint idx) = (uint(orderPos)&0xFFFF, uint(orderPos)>>16);
		uint[] storage sellOrderIdList = sellOrderIdLists[priceTick];
		if(idx >= sellOrderIdList.length) {
			return (remainedMoney, gotStock);
		}
		uint orderId = sellOrderIdList[idx];
		GridOrder memory gridOrder = getGridOrder(orderId);
		uint price = tickToPrice(gridOrder.priceTickHi);
		uint moneyAmountOfMaker = price*uint(gridOrder.stockAmount)/(10**18);
		(uint dealMoneyAmount, uint dealStockAmount) = (0, 0);
		if(moneyAmountOfMaker <= remainedMoney) {
			dealMoneyAmount = moneyAmountOfMaker;
			dealStockAmount = gridOrder.stockAmount;
		} else {
			dealMoneyAmount = remainedMoney;
			dealStockAmount = remainedMoney*(10**18)/price;
		}
		gotStock += dealStockAmount;
		remainedMoney -= dealMoneyAmount;
		gridOrder.stockAmount = uint96(uint(gridOrder.stockAmount) - dealStockAmount);
		gridOrder.moneyAmount = uint96(uint(gridOrder.moneyAmount) + dealMoneyAmount);
		setGridOrder(orderId, gridOrder);
		return (remainedMoney, gotStock);
	}

	function dealWithBuyOrders(uint[] calldata orderPosList, uint stockAmountIn) external payable {
		uint stockAmount = safeReceive(stock, msg.sender, stockAmountIn);
		uint stockAmount0 = stockAmount;
		uint gotMoney = 0;
		for(uint i=0; i<orderPosList.length; i++) {
			for(uint j=0; j<256-48; j+=48) {
				if(stockAmount == 0) {
					break;
				}
				uint48 orderPos = uint48(orderPosList[i]>>j);
				if(orderPos==0) {
					break;
				}
				(stockAmount, gotMoney) = dealWithBuyOrder(uint(orderPos), stockAmount, gotMoney);
			}
		}
		uint fee = gotMoney * 2 / 1000; //0.2% fee
		pendingReward += fee;
		safeTransfer(money, msg.sender, gotMoney - fee);
		safeTransfer(stock, msg.sender, stockAmount);
		emit DealWithBuyOrders(msg.sender, stockAmount0 - stockAmount, gotMoney);
	}

	function dealWithBuyOrder(uint orderPos, uint remainedStock, uint gotMoney) internal returns (uint, uint) {
		(uint priceTick, uint idx) = (uint(orderPos)&0xFFFF, uint(orderPos)>>16);
		uint[] storage sellOrderIdList = sellOrderIdLists[priceTick];
		if(idx >= sellOrderIdList.length) {
			return (remainedStock, gotMoney);
		}
		uint orderId = sellOrderIdList[idx];
		GridOrder memory gridOrder = getGridOrder(orderId);
		uint price = tickToPrice(gridOrder.priceTickLo);
		uint stockAmountOfMaker = uint(gridOrder.stockAmount)*(10**18)/price;
		(uint dealMoneyAmount, uint dealStockAmount) = (0, 0);
		if(stockAmountOfMaker <= remainedStock) {
			dealMoneyAmount = gridOrder.moneyAmount;
			dealStockAmount = stockAmountOfMaker;
		} else {
			dealMoneyAmount = remainedStock*price/(10**18);
			dealStockAmount = remainedStock;
		}
		gotMoney += dealMoneyAmount;
		remainedStock -= dealStockAmount;
		gridOrder.stockAmount = uint96(uint(gridOrder.stockAmount) - dealStockAmount);
		gridOrder.moneyAmount = uint96(uint(gridOrder.moneyAmount) + dealMoneyAmount);
		setGridOrder(orderId, gridOrder);
		return (remainedStock, gotMoney);
	}

	function withdrawReward() external {
		address receiver = IFeeTo(factory).feeTo();
		safeTransfer(money, receiver, pendingReward);
		pendingReward = 0;
	}
}

contract LimitOrdersProxy {
	address public stock;
	address public money;
	address public factory;
	uint immutable public implAddr;
	
	constructor(address _stock, address _money, address _impl) {
		stock = _stock;
		money = _money;
		factory = msg.sender;
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
		require(msg.sender == feeToSetter);
		newFeeToSetter = _newFeeToSetter;
	}

	function acceptFeeToSetter() external {
		require(msg.sender == newFeeToSetter);
		feeToSetter = newFeeToSetter;
	}

	function setFeeTo(address _feeTo) external {
		require(msg.sender == feeToSetter);
		feeTo = _feeTo;
	}

	function create(address stock, address money, address impl) external {
		address pairAddr = address(new LimitOrdersProxy{salt: 0}(stock, money, impl));
		emit Created(stock, money, pairAddr);
	}
}
