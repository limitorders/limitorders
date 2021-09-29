<template>
  <div v-if="hasCurrentMarket" class="normal">
    <h3>Current Market: <code><a v-bind:href="stockURL">{{stockSymbol}}</a>/<a v-bind:href="moneyURL">{{moneySymbol}}</a></code></h3>
    <p style="text-align: center">My Address: {{myAddress}}<br>
    My Balances: {{stockAmount}} {{stockSymbol}}; {{moneyAmount}} {{moneySymbol}}</p>
    <div>
      <table style="margin: auto">
      <tr><td><code>High Price: </code></td>
      <td><input v-model="highPrice" type="number"></td></tr>
      <tr><td><code>&nbsp;Low Price: </code></td>
      <td><input v-model="lowPrice" type="number"></td></tr>
      <tr><td><code>Money Amount ({{moneySymbol}}): </code></td>
      <td><input v-model="moneyPlaced" type="number"></td></tr>
      <tr><td><code>Stock Amount ({{stockSymbol}}): </code></td>
      <td><input v-model="stockPlaced" type="number"></td></tr>
      </table>
      <p style="text-align: center"><button @click="placeGridOrders" style="font-size: 20px">
      <code>Place Grid Orders</code></button></p>
    </div>
    <hr/>
    <div v-show="showOrderList">
      <h4 style="text-align: center">My Grid Orders</h4>
      <table style='border: "1px solid"; margin: auto'><tr>
      <th>&nbsp;&nbsp;High&nbsp;Price</th><th>&nbsp;&nbsp;Low&nbsp;Price</th>
      <th>&nbsp;&nbsp;{{stockSymbol}}</th><th>&nbsp;&nbsp;{{moneySymbol}}</th><th></th></tr>
      <template v-for="(order, idx) in orderList" :keys="order.id">
      <tr>
      <td>{{order.highPrice}}</td>
      <td>&nbsp;&nbsp;&nbsp;{{order.lowPrice}}</td>
      <td>&nbsp;&nbsp;&nbsp;{{order.stockAmount}}</td>
      <td>&nbsp;&nbsp;&nbsp;{{order.moneyAmount}}</td>
      <td>&nbsp;&nbsp;&nbsp;<button @click="cancel" v-bind:name="idx" style="font-size: 20px">cancel</button></td>
      </tr>
      </template>
      </table>
    </div>
 </div>
</template>

<style>
td {
  text-align: right;
}
</style>

<script>
async function getUserOrders(marketAddress, stockDecimals, moneyDecimals) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const myAddress = await signer.getAddress()
  const marketContract = new ethers.Contract(marketAddress, ABI, provider)

  var res = []
  const orders = await marketContract.getUserOrders(myAddress, 0, 365)
  for(var i=0; i<orders.length; i++) {
    res.push(orderArrayToObj(orders[i], 0))
  }
  res.sort(function(a,b) {return a.id.localeCompare(b.id)})
  console.log("orders", res)
  return res
}

export default {
  data() {
    return {
      moneyAmount: 0,
      stockAmount: 0,
      moneyDecimals: 0,
      stockDecimals: 0,
      moneyPlaced: 0,
      stockPlaced: 0,
      highPrice: 0,
      lowPrice: 0,
      stockSymbol: "",
      moneySymbol: "",
      stockAddr: "",
      moneyAddr: "",
      stockURL: "",
      moneyURL: "",
      marketAddress: "",
      showOrderList: false,
      orderList: [],
      hasCurrentMarket: false
    }
  },
  methods: {
    async cancel(event) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      //var gasPrice = await provider.getStorageAt("0x0000000000000000000000000000000000002710","0x00000000000000000000000000000000000000000000000000000000000000002")
      //if(gasPrice == "0x") {
      //  gasPrice = "0x0"
      //}
      const marketContract = new ethers.Contract(this.marketAddress, ABI, provider).connect(signer)
      await marketContract.cancelGridOrder(event.target.name/*, {gasPrice: gasPrice}*/)
    },
    async placeGridOrders() {
      if(!this.hasCurrentMarket) {
        alertNoCurrentMarket()
	return
      }
      if(this.highPrice == 0 || this.lowPrice == 0) {
        alert("Zero price is invalid!")
	return
      }
      if(this.highPrice <= this.lowPrice) {
        alert("High price ("+this.highPrice+") is not larger than low price ("+this.lowPrice+")")
	return
      }
      if(this.moneyPlaced == 0 && this.stockPlaced == 0) {
        alert("Both money and stock are zero in the grid order")
	return
      }
      //var gasPrice = await provider.getStorageAt("0x0000000000000000000000000000000000002710","0x00000000000000000000000000000000000000000000000000000000000000002")
      //if(gasPrice == "0x") {
      //  gasPrice = "0x0"
      //}
      const moneyAmt = await safeGetAmount(this.moneyAddr, this.moneySymbol, this.moneyPlaced,
      				this.moneyDecimals, this.marketAddress, 0)
      if(!moneyAmt) {
        return
      }
      const stockAmt = await safeGetAmount(this.stockAddr, this.stockSymbol, this.stockPlaced,
      				this.stockDecimals, this.marketAddress, 0)
      if(!stockAmt) {
        return
      }
      console.log(moneyAmt)
      console.log(stockAmt)
      const highPrice = ethers.BigNumber.from(packPrice(this.highPrice))
      const lowPrice = ethers.BigNumber.from(packPrice(this.lowPrice))
      const twoPow32 = ethers.BigNumber.from(2).pow(32)
      const twoPow96 = ethers.BigNumber.from(2).pow(96)
      var packedOrder = moneyAmt.mul(twoPow96).add(stockAmt)
      packedOrder = packedOrder.mul(twoPow32).add(highPrice)
      packedOrder = packedOrder.mul(twoPow32).add(lowPrice)
      console.log("packedOrder", packedOrder)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const myAddress = await signer.getAddress()
      //const code = await provider.getCode(this.marketAddress)
      //console.log(code)
      const marketContract = new ethers.Contract(this.marketAddress, ABI, provider).connect(signer)
      await marketContract.createGridOrder(packedOrder/*, {gasPrice: gasPrice}*/)
    },
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
    this.hasCurrentMarket = (currMarket !== null);
    if(this.hasCurrentMarket) {
      const marketArr = currMarket.split(",")
      this.stockSymbol = marketArr[0]
      this.moneySymbol = marketArr[1]
      this.stockAddr = marketArr[2]
      this.moneyAddr = marketArr[3]
      this.stockURL = "https://www.smartscan.cash/address/"+this.stockAddr
      this.moneyURL = "https://www.smartscan.cash/address/"+this.moneyAddr
      this.marketAddress = getMarketAddress(this.stockAddr, this.moneyAddr)

      const stockContract = new ethers.Contract(this.stockAddr, SEP20ABI, provider)
      const moneyContract = new ethers.Contract(this.moneyAddr, SEP20ABI, provider)
      try {
	var balanceAmt = await stockContract.balanceOf(this.myAddress)
        this.stockDecimals = await stockContract.decimals()
        this.stockAmount = ethers.utils.formatUnits(balanceAmt, this.stockDecimals)
	balanceAmt = await moneyContract.balanceOf(this.myAddress)
        this.moneyDecimals = await moneyContract.decimals()
        this.moneyAmount = ethers.utils.formatUnits(balanceAmt, this.moneyDecimals)
      } catch(e) {
        console.log(e)
      }
      this.orderList = await getUserOrders(this.marketAddress, this.stockDecimals, this.moneyDecimals)
      this.showOrderList = this.orderList.length != 0
    } else {
      alertNoCurrentMarket()
    }
  }
}
</script>
