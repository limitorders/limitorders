const timeMachine = require('ganache-time-traveler');
const truffleAssert = require('truffle-assertions');
const unpackPrice = require("./price.js").unpackPrice;
const packPrice = require("./price.js").packPrice;

const LimitOrdersLogic = artifacts.require("LimitOrdersLogic");
const LimitOrdersProxy = artifacts.require("LimitOrdersProxy");
const LimitOrdersFactory = artifacts.require("LimitOrdersFactory");
const FakeToken = artifacts.require("FakeToken");

const _1e18 = 10n ** 18n;
const priceDec = 10n ** 26n;

contract('LimitOrdersFactory', async (accounts) => {

    it('create', async () => {
        const logic = await LimitOrdersLogic.new();
        const factory = await LimitOrdersFactory.new(accounts[0]);
        const wbtc = await FakeToken.new("WBTC", 21000000n * _1e18);
        const usdt = await FakeToken.new("USDT", 10000000n * _1e18);
        const result = await factory.create(wbtc.address, usdt.address, logic.address);
        const event = getPairCreatedEvent(result);
        const pairAddr = event.pairAddr;
        const pair = await LimitOrdersLogic.at(pairAddr);
        assert.equal(await pair.stock(), wbtc.address);
        assert.equal(await pair.money(), usdt.address);
        assert.equal(await pair.factory(), factory.address);
    });

    it('changeFeeToSetter', async () => {
        // console.log('TODO');
    });

    it('setFeeTo', async () => {
        // console.log('TODO');
    });

});

contract('LimitOrdersLogic', async (accounts) => {

    const alice = accounts[0];
    const bob   = accounts[1];

    let logic;
    let factory;
    let wbtc;
    let usdt;
    let pair;

    before(async () => {
        logic = await LimitOrdersLogic.new();
        factory = await LimitOrdersFactory.new(accounts[0]);
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
        const order = await pair.getGridOrder(orderId);
        assert.equal(order.priceBaseLo, 548256975020389);
        assert.equal(order.priceBaseHi, 376865667786415);
        assert.equal(order.priceTickLo, 5196);
        assert.equal(order.priceTickHi, 5442);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);
        assert.equal(order.stockAmount, 1e8);
        assert.equal(order.moneyAmount, 2e8);
        assert.equal(await pair.userOrderIdLists(bob, 0), orderId);
        assert.equal(await pair.sellOrderIdLists(order.priceTickHi, 0), orderId);
        assert.equal(await pair.buyOrderIdLists(order.priceTickLo, 0), orderId);
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

    it('cancelGridOrder', async () => {
        await wbtc.transfer(bob, 6e8, { from: alice });
        await usdt.transfer(bob, 6e8, { from: alice });

        const result0 = await pair.createGridOrder(pack({priceLo: 40000, priceHi: 50000, stock: 1e8, money: 1e8}), { from: bob });
        const result1 = await pair.createGridOrder(pack({priceLo: 40000, priceHi: 50000, stock: 2e8, money: 2e8}), { from: bob });
        const result2 = await pair.createGridOrder(pack({priceLo: 40000, priceHi: 50000, stock: 3e8, money: 3e8}), { from: bob });
        assert.equal(await wbtc.balanceOf(bob), 0);
        assert.equal(await usdt.balanceOf(bob), 0);

        const orderID0 = getOrderID(bob, result0);
        const orderID1 = getOrderID(bob, result1);
        const orderID2 = getOrderID(bob, result2);
        assert.deepEqual(await getUserOrderIDs(pair, bob), [orderID0, orderID1, orderID2]);
        assert.deepEqual(await getSellOrderIDs(pair, 5397), [orderID0, orderID1, orderID2]);
        assert.deepEqual(await getBuyOrderIDs(pair, 5365), [orderID0, orderID1, orderID2]);

        await pair.cancelGridOrder(1, { from: bob });
        assert.deepEqual(await getUserOrderIDs(pair, bob), [orderID0, orderID2]);
        assert.deepEqual(await getSellOrderIDs(pair, 5397), [orderID0, orderID2]);
        assert.deepEqual(await getBuyOrderIDs(pair, 5365), [orderID0, orderID2]);

        const order1 = await pair.getGridOrder(orderID1);
        assert.equal(order1.priceTickLo, 0);
        const order2 = await pair.getGridOrder(orderID2);
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

        await truffleAssert.reverts(pair.cancelGridOrder(0, {from: bob}), "revert");
        await truffleAssert.reverts(pair.cancelGridOrder(1, {from: bob}), "revert");
        await truffleAssert.reverts(pair.cancelGridOrder(1, {from: alice}), "revert");
        await truffleAssert.reverts(pair.cancelGridOrder(2, {from: alice}), "revert");
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
    });

    it('dealWithSellOrders_buyAll', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 40000.00,
            priceHi: 50000.00,
            stock  : 600,
            money  : 0,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder(orderId);
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
        assert.equal(await usdt.balanceOf(bob), 9941251);
        assert.equal(await wbtc.balanceOf(bob), 600);

        order = await pair.getGridOrder(orderId);
        assert.equal(order.stockAmount, 0);
        assert.equal(order.moneyAmount, 29998632);
    });

    it('dealWithSellOrders_buyHalf1', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 40000.00,
            priceHi: 50000.00,
            stock  : 600,
            money  : 0,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder(orderId);
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
        assert.equal(await usdt.balanceOf(bob), 25000000);
        assert.equal(await wbtc.balanceOf(bob), 299);

        order = await pair.getGridOrder(orderId);
        assert.equal(order.stockAmount, 301);
        assert.equal(order.moneyAmount, 14970000);
    });

    it('dealWithSellOrders_buyHalf2', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 40000.00,
            priceHi: 50000.00,
            stock  : 600,
            money  : 0,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder(orderId);
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
        assert.equal(await usdt.balanceOf(bob), 24970626);
        assert.equal(await wbtc.balanceOf(bob), 300);

        order = await pair.getGridOrder(orderId);
        assert.equal(order.stockAmount, 300);
        assert.equal(order.moneyAmount, 14999316);
    });

    it('dealWithBuyOrders_sellAll', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 0,
            money  : 30000 * 100,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder(orderId);
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
        assert.equal(await wbtc.balanceOf(bob), 1);
        assert.equal(await usdt.balanceOf(bob), 2994000);

        order = await pair.getGridOrder(orderId);
        assert.equal(order.stockAmount, 100);
        assert.equal(order.moneyAmount, 0);
    });

    it('dealWithBuyOrders_sellHalf1', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 0,
            money  : 30000 * 100,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder(orderId);
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
        assert.equal(await wbtc.balanceOf(bob), 50);
        assert.equal(await usdt.balanceOf(bob), 1496995);

        order = await pair.getGridOrder(orderId);
        assert.equal(order.stockAmount, 50);
        assert.equal(order.moneyAmount, 1500006);
    });

    it('dealWithBuyOrders_sellHalf2', async () => {
        const result1 = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 0,
            money  : 30000 * 100,
        }), { from: alice });
        const orderId = getOrderID(alice, result1);
        let order = await pair.getGridOrder(orderId);
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
        assert.equal(await wbtc.balanceOf(bob), 51);
        assert.equal(await usdt.balanceOf(bob), 1497000);

        order = await pair.getGridOrder(orderId);
        assert.equal(order.stockAmount, 50);
        assert.equal(order.moneyAmount, 1500000);
    });

    it('dealWithGridOrders_notEnoughToken', async () => {
        const result = await pair.createGridOrder(pack({
            priceLo: 30000.00,
            priceHi: 60000.00,
            stock  : 100,
            money  : 30000 * 100,
        }), { from: alice });
        // const orderId = getOrderID(alice, result);
        // let order = await pair.getGridOrder(orderId);
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

    it('withdrawReward', async () => {
        // console.log('TODO');
    });

});

async function getUserOrderIDs(pair, addr) {
    let ids = [];
    for (let i = 0; ; i++) {
        try {
            let id = await pair.userOrderIdLists(addr, i);
            ids.push(BigInt(id.toString()));
        } catch(e) {
            break;
        }
    }
    return ids;
}
async function getSellOrderIDs(pair, tick) {
    let ids = [];
    for (let i = 0; ; i++) {
        try {
            let id = await pair.sellOrderIdLists(tick, i);
            ids.push(BigInt(id.toString()));
        } catch(e) {
            break;
        }
    }
    return ids;
}
async function getBuyOrderIDs(pair, tick) {
    let ids = [];
    for (let i = 0; ; i++) {
        try {
            let id = await pair.buyOrderIdLists(tick, i);
            ids.push(BigInt(id.toString()));
        } catch(e) {
            break;
        }
    }
    return ids;
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
