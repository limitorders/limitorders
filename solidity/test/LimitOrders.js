const timeMachine = require('ganache-time-traveler');
const truffleAssert = require('truffle-assertions');
const unpackPrice = require("./price.js").unpackPrice;

const LimitOrdersLogic = artifacts.require("LimitOrdersLogic");
const LimitOrdersProxy = artifacts.require("LimitOrdersProxy");
const LimitOrdersFactory = artifacts.require("LimitOrdersFactory");
const FakeToken = artifacts.require("FakeToken");

const _1e18 = 10n ** 18n;

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
        const event = getCreatedEvent(result);
        console.log(event);
    });

    it('cancelGridOrder', async () => {
        console.log('TODO');
    });

    it('dealWithSellOrders', async () => {
        console.log('TODO');
    });

    it('dealWithBuyOrders', async () => {
        console.log('TODO');
    });

    it('withdrawReward', async () => {
        console.log('TODO');
    });

});

contract('LimitOrdersFactory', async (accounts) => {

    it('changeFeeToSetter', async () => {
        console.log('TODO');
    });

    it('setFeeTo', async () => {
        console.log('TODO');
    });

});

contract('price', async (accounts) => {

    it('unpackPrice', async () => {
        for (let i = 0n; i < 7900n; i++) {
            console.log(unpackPrice(i << 19n));
        }
    });

});

function getCreatedEvent(result) {
    const log = result.logs.find(log => log.event == 'Created');
    assert.isNotNull(log);
    return {
        stock   : log.args.stock,
        money   : log.args.money,
        pairAddr: log.args.pairAddr,
    };
}
