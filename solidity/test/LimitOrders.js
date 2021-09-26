// console.log(process.argv.join('='));
const IsSBCH = process.argv.join('=').includes('--network=sbch_');
console.log('IsSBCH:', IsSBCH);

const timeMachine = require('ganache-time-traveler');
const truffleAssert = require('truffle-assertions');
const unpackPrice = require("./price.js").unpackPrice;
const packPrice = require("./price.js").packPrice;

let   LimitOrdersLogic = artifacts.require("LimitOrdersLogic");
const LimitOrdersProxy = artifacts.require("LimitOrdersProxy");
const LimitOrdersFactory = artifacts.require("LimitOrdersFactory");
const FakeToken = artifacts.require("FakeToken");
const IERC20 = artifacts.require("IERC20");

const _1e18 = 10n ** 18n;
const priceDec = 10n ** 26n;

if (IsSBCH) {
    LimitOrdersLogic = artifacts.require("LimitOrdersLogicForSmartBCH");
    truffleAssert.reverts = async function(asyncFn, msg) {
        try {
            await asyncFn;
            throw null;
        } catch (e) {
            assert(e, "Expected an error but did not get one");
            // console.log(JSON.stringify(e));
            // console.log(e.receipt.outData);
            // console.log(web3.utils.hexToAscii('0x' + e.receipt.outData));
            assert.include(web3.utils.hexToAscii('0x' + e.receipt.outData), msg);
        }
    };
}

contract('LimitOrdersFactory', async (accounts) => {

    let logic;
    let wbtc;
    let usdt;

    before(async () => {
        logic = await LimitOrdersLogic.new();
        wbtc = await FakeToken.new("WBTC", 21000000n * _1e18);
        usdt = await FakeToken.new("USDT", 10000000n * _1e18);
    });

    it('create', async () => {
        const factory = await LimitOrdersFactory.new(accounts[0]);
        const result = await factory.create(wbtc.address, usdt.address, logic.address);
        const event = getPairCreatedEvent(result);
        const pairAddr = event.pairAddr;
        const pair = await LimitOrdersLogic.at(pairAddr);
        assert.equal(await pair.stock(), wbtc.address);
        assert.equal(await pair.money(), usdt.address);
        assert.equal(await pair.factory(), factory.address);
    });

    it('setFeeTo', async () => {
        const factory = await LimitOrdersFactory.new(accounts[1], {from: accounts[0]});
        assert.equal(await factory.feeToSetter(), accounts[0]);
        assert.equal(await factory.feeTo(), accounts[1]);

        await factory.setFeeTo(accounts[2], {from: accounts[0]});
        assert.equal(await factory.feeTo(), accounts[2]);
    
        await truffleAssert.reverts(
            factory.setFeeTo(accounts[3], {from: accounts[1]}),
            "not-feeto-setter"
        );
    });

    it('changeFeeToSetter', async () => {
        const factory = await LimitOrdersFactory.new(accounts[0], {from: accounts[1]});
        assert.equal(await factory.feeToSetter(), accounts[1]);

        await truffleAssert.reverts(
            factory.changeFeeToSetter(accounts[2], {from: accounts[2]}),
            "not-feeto-setter"
        );

        await factory.changeFeeToSetter(accounts[2], {from: accounts[1]});
        await truffleAssert.reverts(
            factory.acceptFeeToSetter({from: accounts[3]}),
            "not-new-feeto-setter"
        );

        await factory.acceptFeeToSetter({from: accounts[2]});
        assert.equal(await factory.feeToSetter(), accounts[2]);
    });

});

contract('LimitOrdersLogic', async (accounts) => {

    const alice = accounts[0];
    const bob   = accounts[1];
    const fiddy = accounts[2];

    let logic;
    let factory;
    let wbtc;
    let usdt;
    let pair;

    before(async () => {
        logic = await LimitOrdersLogic.new();
        factory = await LimitOrdersFactory.new(fiddy);
    });

    beforeEach(async () => {
        const totalSupply = 10000000n * _1e18;
        wbtc = await FakeToken.new("WBTC", totalSupply);
        usdt = await FakeToken.new("USDT", totalSupply);
        const result = await factory.create(wbtc.address, usdt.address, logic.address);
        const event = getPairCreatedEvent(result);
        const pairAddr = event.pairAddr;
        pair = await LimitOrdersLogic.at(pairAddr);
        await wbtc.approve(pair.address, totalSupply, { from: alice });
        await usdt.approve(pair.address, totalSupply, { from: alice });
        await wbtc.approve(pair.address, totalSupply, { from: bob });
        await usdt.approve(pair.address, totalSupply, { from: bob });
        // await wbtc.transfer(bob, totalSupply / 2n, { from: alice });
        // await usdt.transfer(bob, totalSupply / 2n, { from: alice });
    });

    it('createGridOrder', async () => {
        await wbtc.transfer(bob, 5e8, { from: alice });
        await usdt.transfer(bob, 5e8, { from: alice });

        const result = await pair.createGridOrder(pack({
            priceLo: 12345.67,
            priceHi: 67890.12,
            stock  : 1e8,
            money  : 2e8,
        }), { from: bob });
        const orderId = getOrderID(bob, result);
        const order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceBaseLo, 548256975020389);
        assert.equal(order.priceBaseHi, 376865667786415);
        assert.equal(order.priceTickLo, 5196);
        assert.equal(order.priceTickHi, 5442);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);
        assert.equal(order.stockAmount, 1e8);
        assert.equal(order.moneyAmount, 2e8);
        assert.deepEqual(await getUserOrderIDs(pair, bob), [orderId]);
        assert.deepEqual(await getSellOrderIDs(pair, order.priceTickHi), [orderId]);
        assert.deepEqual(await getBuyOrderIDs(pair, order.priceTickLo), [orderId]);
        // console.log(mergePrice(order.priceBaseLo, order.priceTickLo));
        // console.log(mergePrice(order.priceBaseHi, order.priceTickHi));
        assert.equal(await wbtc.balanceOf(bob), 4e8);
        assert.equal(await usdt.balanceOf(bob), 3e8);
    });

    it('createGridOrder_invalidPrice', async () => {
        await truffleAssert.reverts(
            pair.createGridOrder(pack({priceLo: 12345, priceHi: 11111, stock: 1, money: 1})),
            "Hi<=Lo"
        );
        await truffleAssert.reverts(
            pair.createGridOrder(packOrder(0, 1, 2, 3)),
            "zero-price-tick"
        );
    });

    it('createGridOrder_notEnoughToken', async () => {
        await wbtc.transfer(bob, 123, { from: alice });
        await usdt.transfer(bob, 456, { from: alice });
        await truffleAssert.reverts(
            pair.createGridOrder(pack({priceLo: 12345, priceHi: 54321, stock: 500, money: 1}), {from: bob}),
            "ERC20: transfer amount exceeds balance"
        );
        await truffleAssert.reverts(
            pair.createGridOrder(pack({priceLo: 12345, priceHi: 54321, stock: 1, money: 500}), {from: bob}),
            "ERC20: transfer amount exceeds balance"
        );
    });

    it('createGridOrder_sendBCH', async () => {
        await wbtc.transfer(bob, 123, { from: alice });
        await usdt.transfer(bob, 456, { from: alice });
        await truffleAssert.reverts(
            pair.createGridOrder(
                pack({priceLo: 12345, priceHi: 54321, stock: 1, money: 1}), 
                { from: bob, value: 999 }),
            "dont-send-bch"
        );
    });

    it('getUserOrders', async () => {
        await wbtc.transfer(bob, 6e8, { from: alice });
        await usdt.transfer(bob, 6e8, { from: alice });

        const o0 = await createGridOrder(pair, bob, {priceLo: 10000, priceHi: 20000, stock: 1e5, money: 1e5});
        const o1 = await createGridOrder(pair, bob, {priceLo: 20000, priceHi: 30000, stock: 2e5, money: 2e5});
        const o2 = await createGridOrder(pair, bob, {priceLo: 30000, priceHi: 40000, stock: 3e5, money: 3e5});
        const o3 = await createGridOrder(pair, bob, {priceLo: 40000, priceHi: 50000, stock: 3e5, money: 3e5});
        const o4 = await createGridOrder(pair, bob, {priceLo: 50000, priceHi: 60000, stock: 3e5, money: 3e5});

        assert.deepEqual(await getUserOrderIDs(pair, bob, 0, '0'), []);
        assert.deepEqual(await getUserOrderIDs(pair, bob, 0, 1), [o0]);
        assert.deepEqual(await getUserOrderIDs(pair, bob, 0, 2), [o0, o1]);
        assert.deepEqual(await getUserOrderIDs(pair, bob, 0, 3), [o0, o1, o2]);
        assert.deepEqual(await getUserOrderIDs(pair, bob, 0, 4), [o0, o1, o2, o3]);
        assert.deepEqual(await getUserOrderIDs(pair, bob, 1, 4), [o1, o2, o3]);
        assert.deepEqual(await getUserOrderIDs(pair, bob, 2, 5), [o2, o3, o4]);
        assert.deepEqual(await getUserOrderIDs(pair, bob, 3, 6), [o3, o4]);
    });

    it('cancelGridOrder', async () => {
        await wbtc.transfer(bob, 6e8, { from: alice });
        await usdt.transfer(bob, 6e8, { from: alice });

        const orderID0 = await createGridOrder(pair, bob, {priceLo: 40000, priceHi: 50000, stock: 1e8, money: 1e8});
        const orderID1 = await createGridOrder(pair, bob, {priceLo: 40000, priceHi: 50000, stock: 2e8, money: 2e8});
        const orderID2 = await createGridOrder(pair, bob, {priceLo: 40000, priceHi: 50000, stock: 3e8, money: 3e8});
        assert.deepEqual(await getUserOrderIDs(pair, bob), [orderID0, orderID1, orderID2]);
        assert.deepEqual(await getSellOrderIDs(pair, 5397), [orderID0, orderID1, orderID2]);
        assert.deepEqual(await getBuyOrderIDs(pair, 5365), [orderID0, orderID1, orderID2]);
        assert.equal(await wbtc.balanceOf(bob), 0);
        assert.equal(await usdt.balanceOf(bob), 0);

        await pair.cancelGridOrder(1, { from: bob });
        assert.deepEqual(await getUserOrderIDs(pair, bob), [orderID0, orderID2]);
        assert.deepEqual(await getSellOrderIDs(pair, 5397), [orderID0, orderID2]);
        assert.deepEqual(await getBuyOrderIDs(pair, 5365), [orderID0, orderID2]);

        const order1 = await pair.getGridOrder.call(orderID1);
        assert.equal(order1.priceTickLo, 0);
        const order2 = await pair.getGridOrder.call(orderID2);
        assert.equal(order2.priceTickLo, 5365);
        assert.equal(order2.priceTickHi, 5397);
        assert.equal(order2.indexInSellList, 1);
        assert.equal(order2.indexInBuyList, 1);

        assert.equal(await wbtc.balanceOf(bob), 2e8);
        assert.equal(await usdt.balanceOf(bob), 2e8);
    });

    it('cancelGridOrder_invalidUserIdx', async () => {
        const result = await pair.createGridOrder(
            pack({priceLo: 12345, priceHi: 67890, stock: 123, money: 456}),
            {from: alice});
        const orderId = getOrderID(alice, result);
        assert.deepEqual(await getUserOrderIDs(pair, alice), [orderId]);
        assert.deepEqual(await getUserOrderIDs(pair, bob), []);

        const msg = IsSBCH ? "" : "revert";
        await truffleAssert.reverts(pair.cancelGridOrder(0, {from: bob}), msg);
        await truffleAssert.reverts(pair.cancelGridOrder(1, {from: bob}), msg);
        await truffleAssert.reverts(pair.cancelGridOrder(1, {from: alice}), msg);
        await truffleAssert.reverts(pair.cancelGridOrder(2, {from: alice}), msg);
    });

    it('dealWithSellOrders', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 12345.67,
            priceHi: 67890.12,
            stock  : 1e8,
            money  : 1e8,
        }), { from: alice });

        await usdt.transfer(bob, 1e8, { from: alice });
        const result2 = await pair.dealWithSellOrders(
            70000n * priceDec,   // maxPrice,
            [5442n],             // orderPosList
            BigInt(1e8) << 96n | // moneyAmountIn
            BigInt(1e8),         // maxGotStock
            { from: bob },
        );
        assert.equal(await usdt.balanceOf(bob), 0);
        assert.equal(await wbtc.balanceOf(bob), 1470);

        // console.log(result2.logs[0].args);
        const BN = web3.utils.toBN;
        truffleAssert.eventEmitted(result2, 'DealWithSellOrders', 
            { taker: bob, stockAmount: BN(1470), moneyAmount: BN(99800000) });
    });

    it('dealWithBuyOrders', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 12345.67,
            priceHi: 67890.12,
            stock  : 1e8,
            money  : 1e8,
        }), { from: alice });

        await wbtc.transfer(bob, 1000, { from: alice });
        const result2 = await pair.dealWithBuyOrders(
            10000n * priceDec,    // minPrice,
            [5196n],              // orderPosList
            BigInt(1000) << 96n | // stockAmountIn
            BigInt(1e8),          // maxGotMoney
            { from: bob },
        );
        assert.equal(await wbtc.balanceOf(bob), 0);
        assert.equal(await usdt.balanceOf(bob), 12320958);
 
        // console.log(result2.logs[0].args);
        const BN = web3.utils.toBN;
        truffleAssert.eventEmitted(result2, 'DealWithBuyOrders', 
            { taker: bob, stockAmount: BN(1000), moneyAmount: BN(12345649) });
    });

    it('dealWithSellOrders_buyAll', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 40000.00,
            priceHi: 50000.00,
            stock  : 600,
            money  : 0,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5365);
        assert.equal(order.priceTickHi, 5397);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        await usdt.transfer(bob, 4e7, { from: alice });
        const result2 = await pair.dealWithSellOrders(
            50000n * priceDec,   // maxPrice,
            [5397n],             // orderPosList
            BigInt(4e7) << 96n | // moneyAmountIn
            BigInt(1000),        // maxGotStock
            { from: bob },
        );

        order = await pair.getGridOrder.call(orderId);
        assert.equal(order.stockAmount, 0);
        assert.equal(order.moneyAmount, 29998632);

        assert.equal(await wbtc.balanceOf(bob), 600);
        assert.equal(await usdt.balanceOf(bob), 9941251);
        assert.equal(await pair.pendingReward(), 60117);
    });

    it('dealWithSellOrders_buyHalf1', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 40000.00,
            priceHi: 50000.00,
            stock  : 600,
            money  : 0,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5365);
        assert.equal(order.priceTickHi, 5397);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        await usdt.transfer(bob, 4e7, { from: alice });
        const result2 = await pair.dealWithSellOrders(
            50000n * priceDec,        // maxPrice,
            [5397n],                  // orderPosList
            BigInt(15000000) << 96n | // moneyAmountIn
            BigInt(1000),             // maxGotStock
            { from: bob },
        );

        order = await pair.getGridOrder.call(orderId);
        assert.equal(order.stockAmount, 301);
        assert.equal(order.moneyAmount, 14970000);

        assert.equal(await wbtc.balanceOf(bob), 299);
        assert.equal(await usdt.balanceOf(bob), 25000000);
        assert.equal(await pair.pendingReward(), 30000);
    });

    it('dealWithSellOrders_buyHalf2', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 40000.00,
            priceHi: 50000.00,
            stock  : 600,
            money  : 0,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5365);
        assert.equal(order.priceTickHi, 5397);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        await usdt.transfer(bob, 4e7, { from: alice });
        const result2 = await pair.dealWithSellOrders(
            50000n * priceDec,   // maxPrice,
            [5397n],             // orderPosList
            BigInt(4e7) << 96n | // moneyAmountIn
            BigInt(300),         // maxGotStock
            { from: bob },
        );

        order = await pair.getGridOrder.call(orderId);
        assert.equal(order.stockAmount, 300);
        assert.equal(order.moneyAmount, 14999316);

        assert.equal(await wbtc.balanceOf(bob), 300);
        assert.equal(await usdt.balanceOf(bob), 24970626);
        assert.equal(await pair.pendingReward(), 30058);
    });

    it('dealWithBuyOrders_sellAll', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 0,
            money  : 30000 * 100,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5324);
        assert.equal(order.priceTickHi, 5424);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        await wbtc.transfer(bob, 101, { from: alice });
        const result2 = await pair.dealWithBuyOrders(
            20000n * priceDec,   // minPrice,
            [5324n],             // orderPosList
            BigInt(100) << 96n | // stockAmountIn
            BigInt(3e8),         // maxGotMoney
            { from: bob },
        );

        order = await pair.getGridOrder.call(orderId);
        assert.equal(order.stockAmount, 100);
        assert.equal(order.moneyAmount, 0);

        assert.equal(await wbtc.balanceOf(bob), 1);
        assert.equal(await usdt.balanceOf(bob), 2994000);
        assert.equal(await pair.pendingReward(), 6000);
    });

    it('dealWithBuyOrders_sellHalf1', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 0,
            money  : 30000 * 100,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5324);
        assert.equal(order.priceTickHi, 5424);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        await wbtc.transfer(bob, 100, { from: alice });
        const result2 = await pair.dealWithBuyOrders(
            20000n * priceDec,  // minPrice,
            [5324n],            // orderPosList
            BigInt(50) << 96n | // stockAmountIn
            BigInt(3e8),        // maxGotMoney
            { from: bob },
        );

        order = await pair.getGridOrder.call(orderId);
        assert.equal(order.stockAmount, 50);
        assert.equal(order.moneyAmount, 1500006);

        assert.equal(await wbtc.balanceOf(bob), 50);
        assert.equal(await usdt.balanceOf(bob), 1496995);
        assert.equal(await pair.pendingReward(), 2999);
    });

    it('dealWithBuyOrders_sellHalf2', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 0,
            money  : 30000 * 100,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5324);
        assert.equal(order.priceTickHi, 5424);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        await wbtc.transfer(bob, 101, { from: alice });
        const result2 = await pair.dealWithBuyOrders(
            20000n * priceDec,   // minPrice,
            [5324n],             // orderPosList
            BigInt(100) << 96n | // stockAmountIn
            BigInt(1500000),     // maxGotMoney
            { from: bob },
        );

        order = await pair.getGridOrder.call(orderId);
        assert.equal(order.stockAmount, 50);
        assert.equal(order.moneyAmount, 1500000);

        assert.equal(await wbtc.balanceOf(bob), 51);
        assert.equal(await usdt.balanceOf(bob), 1497000);
        assert.equal(await pair.pendingReward(), 3000);
    });

    it('dealWithGridOrders_notEnoughToken', async () => {
        const result = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 100,
            money  : 30000 * 100,
        }), { from: alice });
        // const orderId = getOrderID(alice, result);
        // let order = await pair.getGridOrder.call(orderId);
        // console.log(order);

        await wbtc.transfer(bob, 500, { from: alice });
        await usdt.transfer(bob, 500, { from: alice });

        await truffleAssert.reverts(
            pair.dealWithSellOrders(
                50000n * priceDec,   // maxPrice,
                [5424n],             // orderPosList
                BigInt(501) << 96n | // moneyAmountIn
                BigInt(1500000),     // maxGotStock
                { from: bob },
            ),
            "ERC20: transfer amount exceeds balance"
        );
        await truffleAssert.reverts(
            pair.dealWithBuyOrders(
                50000n * priceDec,   // minPrice,
                [5324n],             // orderPosList
                BigInt(501) << 96n | // stockAmountIn
                BigInt(1500000),     // maxGotMoney
                { from: bob },
            ),
            "ERC20: transfer amount exceeds balance"
        );
    });

    it('dealWithGridOrders_sendBCH', async () => {
        const result = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 100,
            money  : 30000 * 100,
        }), { from: alice });
        // const orderId = getOrderID(alice, result);
        // let order = await pair.getGridOrder.call(orderId);
        // console.log(order);

        await wbtc.transfer(bob, 500, { from: alice });
        await usdt.transfer(bob, 500, { from: alice });

        await truffleAssert.reverts(
            pair.dealWithSellOrders(
                50000n * priceDec,   // maxPrice,
                [5424n],             // orderPosList
                BigInt(400) << 96n | // moneyAmountIn
                BigInt(1500000),     // maxGotStock
                { from: bob, value: 123 },
            ),
            "dont-send-bch"
        );
        await truffleAssert.reverts(
            pair.dealWithBuyOrders(
                50000n * priceDec,   // minPrice,
                [5324n],             // orderPosList
                BigInt(400) << 96n | // stockAmountIn
                BigInt(1500000),     // maxGotMoney
                { from: bob, value: 123 },
            ),
            "dont-send-bch"
        );
    });

    it('withdrawReward', async () => {
        const result = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 100,
            money  : 30000 * 100,
        }), { from: alice });
        // const orderId = getOrderID(alice, result);
        // let order = await pair.getGridOrder.call(orderId);
        // console.log(order);

        await usdt.transfer(bob, 6e6, { from: alice });
        await pair.dealWithSellOrders(
            60000n * priceDec,   // maxPrice,
            [5424n],             // orderPosList
            BigInt(6e6) << 96n | // moneyAmountIn
            BigInt(101),         // maxGotStock
            { from: bob },
        );

        assert.equal(await pair.pendingReward(), 12000);
        await pair.withdrawReward();
        assert.equal(await usdt.balanceOf(fiddy), 12000);
    });

});


contract('LimitOrdersLogic_SEP206', async (accounts) => {

    const alice = accounts[0];
    const bob   = accounts[1];
    const fiddy = accounts[2];

    let logic;
    let factory;
    let sbch;
    let usdt;
    let pair;

    before(async () => {
        logic = await LimitOrdersLogic.new();
        factory = await LimitOrdersFactory.new(fiddy);
        sbch = new IERC20("0x0000000000000000000000000000000000002711");
    });

    beforeEach(async () => {
        const totalSupply = 10000000n * _1e18;
        usdt = await FakeToken.new("USDT", totalSupply);
        const result = await factory.create(sbch.address, usdt.address, logic.address);
        const event = getPairCreatedEvent(result);
        const pairAddr = event.pairAddr;
        pair = await LimitOrdersLogic.at(pairAddr);
        await sbch.approve(pair.address, totalSupply, { from: alice });
        await sbch.approve(pair.address, totalSupply, { from: bob });
        await usdt.approve(pair.address, totalSupply, { from: alice });
        await usdt.approve(pair.address, totalSupply, { from: bob });
    });

    it('createGridOrder', async () => {
        await usdt.transfer(bob, 5e8, { from: alice });

        // console.log('pair:', pair.address);
        const result = await pair.createGridOrder(pack({
            priceLo: 12345.67,
            priceHi: 67890.12,
            stock  : 1e8,
            money  : 2e8,
        }), { from: bob, value: 1e8 });
        const orderId = getOrderID(bob, result);
        const order = await pair.getGridOrder.call(orderId);
        assert.equal(order.priceBaseLo, 548256975020389);
        assert.equal(order.priceBaseHi, 376865667786415);
        assert.equal(order.priceTickLo, 5196);
        assert.equal(order.priceTickHi, 5442);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);
        assert.equal(order.stockAmount, 1e8);
        assert.equal(order.moneyAmount, 2e8);
        assert.deepEqual(await getUserOrderIDs(pair, bob), [orderId]);
        assert.deepEqual(await getSellOrderIDs(pair, order.priceTickHi), [orderId]);
        assert.deepEqual(await getBuyOrderIDs(pair, order.priceTickLo), [orderId]);
        assert.equal(await usdt.balanceOf(bob), 3e8);
    });

    it('createGridOrder_bchNotMatch', async () => {
        await usdt.transfer(bob, 5e8, { from: alice });

        await truffleAssert.reverts(
            pair.createGridOrder(pack({
                priceLo: 12345.67,
                priceHi: 67890.12,
                stock  : 1e8,
                money  : 2e8,
            }), { from: bob, value: 1e8 - 1 }),
            'value-mismatch'
        );
        await truffleAssert.reverts(
            pair.createGridOrder(pack({
                priceLo: 12345.67,
                priceHi: 67890.12,
                stock  : 1e8,
                money  : 2e8,
            }), { from: bob, value: 1e8 + 1 }),
            'value-mismatch'
        );
    });

    it('dealWithSellOrders_buyAll', async () => {
        if (!IsSBCH) {
            return;
        }

        const result1 = await pair.createGridOrder(pack({
            priceLo: 40000.00,
            priceHi: 50000.00,
            stock  : 600,
            money  : 0,
        }), { from: alice, value: 600 });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5365);
        assert.equal(order.priceTickHi, 5397);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        await usdt.transfer(bob, 4e7, { from: alice });
        const result2 = await pair.dealWithSellOrders(
            50000n * priceDec,   // maxPrice,
            [5397n],             // orderPosList
            BigInt(4e7) << 96n | // moneyAmountIn
            BigInt(1000),        // maxGotStock
            { from: bob },
        );

        order = await pair.getGridOrder.call(orderId);
        assert.equal(order.stockAmount, 0);
        assert.equal(order.moneyAmount, 29998632);

        // assert.equal(await wbtc.balanceOf(bob), 600);
        assert.equal(await usdt.balanceOf(bob), 9941251);
        assert.equal(await pair.pendingReward(), 60117);
    });

    it('dealWithBuyOrders_sellAll', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 0,
            money  : 30000 * 100,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5324);
        assert.equal(order.priceTickHi, 5424);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        // await wbtc.transfer(bob, 101, { from: alice });
        const result2 = await pair.dealWithBuyOrders(
            20000n * priceDec,   // minPrice,
            [5324n],             // orderPosList
            BigInt(100) << 96n | // stockAmountIn
            BigInt(3e8),         // maxGotMoney
            { from: bob, value: 100 },
        );

        order = await pair.getGridOrder.call(orderId);
        assert.equal(order.stockAmount, 100);
        assert.equal(order.moneyAmount, 0);

        // assert.equal(await wbtc.balanceOf(bob), 1);
        assert.equal(await usdt.balanceOf(bob), 2994000);
        assert.equal(await pair.pendingReward(), 6000);
    });

    it('dealWithBuyOrders_bchNotMatch', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 0,
            money  : 30000 * 100,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder.call(orderId);
        // console.log(order);
        assert.equal(order.priceTickLo, 5324);
        assert.equal(order.priceTickHi, 5424);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);

        await truffleAssert.reverts(
            pair.dealWithBuyOrders(
                20000n * priceDec,   // minPrice,
                [5324n],             // orderPosList
                BigInt(100) << 96n | // stockAmountIn
                BigInt(3e8),         // maxGotMoney
                { from: bob, value: 99 },
            ),
            'value-mismatch'
        );
        await truffleAssert.reverts(
            pair.dealWithBuyOrders(
                20000n * priceDec,   // minPrice,
                [5324n],             // orderPosList
                BigInt(100) << 96n | // stockAmountIn
                BigInt(3e8),         // maxGotMoney
                { from: bob, value: 101 },
            ),
            'value-mismatch'
        );
    });

});


async function createGridOrder(pair, addr, args) {
    const result = await pair.createGridOrder(pack(args), { from: addr });
    return getOrderID(addr, result);
}

async function getUserOrderIDs(pair, addr, start, end) {
    start = start || 0;
    end = end || 99;
    let orders = await pair.getUserOrders.call(addr, start, end);
    return orders.map(x => BigInt(x[0].toString()));
}
async function getSellOrderIDs(pair, tick, start, end) {
    start = start || 0;
    end = end || 99;
    let orders = await pair.getSellOrders.call(tick, start, end);
    return orders.map(x => BigInt(x[0].toString()));
}
async function getBuyOrderIDs(pair, tick, start, end) {
    start = start || 0;
    end = end || 99;
    let orders = await pair.getBuyOrders.call(tick, start, end);
    return orders.map(x => BigInt(x[0].toString()));
}

function getOrderID(addr, result) {
    const blockNum = result.receipt.blockNumber;
    return BigInt(addr) << 96n | BigInt(blockNum) << 32n;
}

function mergePrice(base, tick) {
    return BigInt(base) << (BigInt(tick) / 100n);
}

// https://stackoverflow.com/questions/22335853/hack-to-convert-javascript-number-to-uint32
function pack(order) {
    return packOrder(
        packPrice(order.priceLo) >>> 0,
        packPrice(order.priceHi) >>> 0,
        order.stock,
        order.money
    );
}

function packPrice2(price) {
    const packed = packPrice(price) >>> 0;
    console.log('packPrice, price=', price, 'packed=', packed);
    return packed;
}

// [moneyAmount:96][stockAmount:96][packedPriceHi:32][packedPriceLo:32]
function packOrder(packedPriceLo, packedPriceHi, stockAmount, moneyAmount) {
    // console.log('packOrder, args:', packedPriceLo, packedPriceHi, stockAmount, moneyAmount);
    const packed = BigInt(packedPriceLo)
                 | BigInt(packedPriceHi) <<  32n
                 | BigInt(stockAmount)   <<  64n
                 | BigInt(moneyAmount)   << 160n;
    // console.log('packed:', packed);
    return packed;
}

function getPairCreatedEvent(result) {
    const log = result.logs.find(log => log.event == 'Created');
    assert.isNotNull(log);
    return {
        stock   : log.args.stock,
        money   : log.args.money,
        pairAddr: log.args.pairAddr,
    };
}
function getGridOrderCreatedEvent(result) {
    const log = result.logs.find(log => log.event == 'CreateGridOrder');
    assert.isNotNull(log);
    return {
        maker      : log.args.maker,
        packedOrder: log.args.packedOrder,
    };
}
