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
        const result = await pair.createGridOrder(pack({
            priceLo: 12345.67,
            priceHi: 67890.12,
            stock  : 1e8,
            money  : 1e8,
        }), { from: alice });
        const orderId = getOrderID(alice, result);
        const order = await pair.getGridOrder(orderId);
        assert.equal(order.priceBaseLo, 1600103478202431);
        assert.equal(order.priceBaseHi, 376865667786415);
        assert.equal(order.priceTickLo, 5196);
        assert.equal(order.priceTickHi, 5442);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);
        assert.equal(order.stockAmount, 1e8);
        assert.equal(order.moneyAmount, 1e8);
        assert.equal(await pair.userOrderIdLists(alice, 0), orderId);
        assert.equal(await pair.sellOrderIdLists(order.priceTickHi, 0), orderId);
        assert.equal(await pair.buyOrderIdLists(order.priceTickLo, 0), orderId);
        // console.log(mergePrice(order.priceBaseLo, order.priceTickLo));
        // console.log(mergePrice(order.priceBaseHi, order.priceTickHi));
    });

    it('cancelGridOrder', async () => {
        // console.log('TODO');
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
            70000n * priceDec, // maxPrice,
            [5442n], // orderPosList
            BigInt(1e8) << 96n | BigInt(1e8), // moneyAmountIn_maxGotStock
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
            10000n * priceDec, // minPrice,
            [5196n], // orderPosList
            BigInt(1000) << 96n | BigInt(1e8), // stockAmountIn_maxGotMoney
            { from: bob },
        );
        assert.equal(await wbtc.balanceOf(bob), 0);
        assert.equal(await usdt.balanceOf(bob), 35959065);
    });

    it('withdrawReward', async () => {
        // console.log('TODO');
    });

});

function mergePrice(base, tick) {
    return BigInt(base) << (BigInt(tick) / 100n);
}

function getOrderID(addr, result) {
    const blockNum = result.receipt.blockNumber;
    return BigInt(addr) << 96n | BigInt(blockNum) << 32n;
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
