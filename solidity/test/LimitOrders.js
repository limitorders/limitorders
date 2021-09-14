const timeMachine = require('ganache-time-traveler');
const truffleAssert = require('truffle-assertions');
const unpackPrice = require("./price.js").unpackPrice;
const packPrice = require("./price.js").packPrice;

const LimitOrdersLogic = artifacts.require("LimitOrdersLogic");
const LimitOrdersProxy = artifacts.require("LimitOrdersProxy");
const LimitOrdersFactory = artifacts.require("LimitOrdersFactory");
const FakeToken = artifacts.require("FakeToken");

const _1e18 = 10n ** 18n;

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

    // let logic;
    // let proxy;
    // let factory;

    before(async () => {
        // TODO
    });

    it('createGridOrder', async () => {
        const logic = await LimitOrdersLogic.new();
        const factory = await LimitOrdersFactory.new(accounts[0]);
        const wbtc = await FakeToken.new("WBTC", 21000000n * _1e18);
        const usdt = await FakeToken.new("USDT", 10000000n * _1e18);
        const result = await factory.create(wbtc.address, usdt.address, logic.address);
        const event = getPairCreatedEvent(result);
        const pairAddr = event.pairAddr;
        const pair = await LimitOrdersLogic.at(pairAddr);

        await wbtc.approve(pair.address, 1e10);
        await usdt.approve(pair.address, 1e10);
        const result2 = await pair.createGridOrder(pack({
            priceLo: 12345.67,
            priceHi: 67890.12,
            stock  : 1e8,
            money  : 1e8,
        }));

        const orderId = getOrderID(accounts[0], result2);
        const order = await pair.getGridOrder(orderId);
        assert.equal(order.priceBaseLo, 1600103478202431);
        assert.equal(order.priceBaseHi, 376865667786415);
        assert.equal(order.priceTickLo, 5196);
        assert.equal(order.priceTickHi, 5442);
        assert.equal(order.indexInSellList, 0);
        assert.equal(order.indexInBuyList, 0);
        assert.equal(order.stockAmount, 1e8);
        assert.equal(order.moneyAmount, 1e8);
        assert.equal(await pair.userOrderIdLists(accounts[0], 0), orderId);
        assert.equal(await pair.sellOrderIdLists(order.priceTickHi, 0), orderId);
        assert.equal(await pair.buyOrderIdLists(order.priceTickLo, 0), orderId);
        // TODO
    });

    it('cancelGridOrder', async () => {
        // console.log('TODO');
    });

    it('dealWithSellOrders', async () => {
        // console.log('TODO');
    });

    it('dealWithBuyOrders', async () => {
        // console.log('TODO');
    });

    it('withdrawReward', async () => {
        // console.log('TODO');
    });

});

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
