<template>
  <div class="normal">
    <p style="text-align: center"><button @click="listHistory" style="font-size: 20px">
    List My Historical Orders</button></p>
    <hr/>
    <div v-show="showOrderList">
      <table style='border: "1px solid"; margin: auto'><tr>
      <th align="right">&nbsp;&nbsp;Order Type</th>
      <th align="right">&nbsp;&nbsp;Stock</th>
      <th align="right">&nbsp;&nbsp;Money</th>
      <th align="right">&nbsp;&nbsp;Price</th>
      <th align="right">&nbsp;&nbsp;Time</th></tr>
      <template v-for="(order, idx) in orderList" :keys="order.time">
      <tr>
      <td>{{order.direction}}</td>
      <td>&nbsp;&nbsp;&nbsp;{{order.stockAmount}}</td>
      <td>&nbsp;&nbsp;&nbsp;{{order.moneyAmount}}</td>
      <td>&nbsp;&nbsp;&nbsp;{{order.price}}</td>
      <td>&nbsp;&nbsp;&nbsp;{{order.time}}</td>
      </tr>
      </template>
      </table>
    </div>
 </div>
</template>

<script>
function hexToFloat(hexStr, decimals) {
  const bn = ethers.BigNumber.from(hexStr)
  return ethers.utils.formatUnits(bn, decimals)*1.0
}

export default {
  data() {
    return {
      stockSymbol: "",
      moneySymbol: "",
      moneyDecimals: 0,
      stockDecimals: 0,
      stockAddr: "",
      moneyAddr: "",
      marketAddress: "",
      showOrderList: false,
      orderList: []
    }
  },
  methods: {
    async listHistory() {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const myAddr = await signer.getAddress()
      const myAddrPad32 = ethers.utils.hexZeroPad(myAddr, 32)
      var filter = {address: this.marketAddress, topics: [null, myAddrPad32]}
      const STEPS = 50000
      var toBlock = await provider.getBlockNumber()
      const blockCountInOneMonth = 30*24*3600/5
      const endHeight = Math.max(0, toBlock - 3*blockCountInOneMonth)
      var orderList = []
      while(toBlock > endHeight) {
        filter.toBlock = toBlock
	filter.fromBlock = Math.max(toBlock-STEPS+1, 0)
        var logs = await provider.getLogs(filter)
	for(var i=0; i<logs.length; i++) {
	  //const bn = abiCoder.decode(["uint"], logs[i].data)
	  //console.log("here", logs[i].topics[0], logs[i].data, bn[0].toHexString())
	  if(logs[i].topics[0] == DealWithBuyOrders || logs[i].topics[0] == DealWithSellOrders) {
	    var order = {
	      direction: "sell",
	      price: "-",
	      stockAmount: hexToFloat("0x"+logs[i].data.substr(2,24), this.stockDecimals),
	      moneyAmount: hexToFloat("0x"+logs[i].data.substr(2+24,24), this.stockDecimals),
	    }
	    if(order.stockAmount != 0) {
	      order.price = order.moneyAmount / order.stockAmount
	    }
	    var timestamp = parseInt(logs[i].data.substr(2+48), 16)
	    var t = new Date()
	    order.time = t.toLocaleString()
	    t.setTime(timestamp)
	    if(logs[i].topics[0] == DealWithSellOrders) {
	      order.direction = "buy"
	    }
	    orderList.push(order)
	  }
	}
	toBlock -= STEPS
      }
      this.showOrderList = true
      this.orderList = orderList
    }
  },
  async mounted() {
    if (typeof window.ethereum === 'undefined') {
      alertNoWallet()
      return
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    this.myAddress = await signer.getAddress()

    const currMarket = localStorage.getItem('currMarket');
    const hasCurrentMarket = (currMarket !== null);
    if(hasCurrentMarket) {
      const marketArr = currMarket.split(",")
      this.stockSymbol = marketArr[0]
      this.moneySymbol = marketArr[1]
      this.stockAddr = marketArr[2]
      this.moneyAddr = marketArr[3]
      this.marketAddress = getMarketAddress(this.stockAddr, this.moneyAddr)
      const stockContract = new ethers.Contract(this.stockAddr, SEP20ABI, provider)
      const moneyContract = new ethers.Contract(this.moneyAddr, SEP20ABI, provider)
      this.stockDecimals = await stockContract.decimals()
      this.moneyDecimals = await moneyContract.decimals()
    } else {
      alertNoCurrentMarket()
    }
  }
}
</script>
