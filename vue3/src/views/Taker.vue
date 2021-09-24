<template>
  <div v-if="hasCurrentMarket" class="normal">
    <h3>Current Market: <code><a v-bind:href="stockURL">{{stockSymbol}}</a>/<a v-bind:href="moneyURL">{{moneySymbol}}</a></code></h3>
    <p style="text-align: center">My Address: {{myAddress}}<br>
    My Balances: {{stockAmount}} {{stockSymbol}}; {{moneyAmount}} {{moneySymbol}}</p>
    <p style="text-align: center;">
      <input type="radio" id="buy" value="Buy" v-model="picked" style="width: 50px">
      <label for="buy" @click="toBuy" v-bind:style="picked=='Buy'? 'font-weight: bold; text-decoration: underline;': ''">
      I Want to Buy {{stockSymbol}}</label>
      <code style="color: lightgrey;">&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;</code>
      <input type="radio" id="sell" value="Sell" v-model="picked" style="width: 50px">
      <label for="sell" @click="toSell" v-bind:style="picked=='Sell'? 'font-weight: bold; text-decoration: underline;': ''">
      I Want to Sell {{stockSymbol}}</label>
    </p>
    <div v-if="picked=='Buy'">
      <table style="margin: auto">
      <tr><td><code>&nbsp;Buy Price ({{moneySymbol}}): </code></td>
      <td><input v-model="buyPrice" type="number"></td></tr>
      <tr><td><code>&nbsp;Buy Amount ({{stockSymbol}}): </code></td>
      <td><input v-model="buyAmount" type="number"></td></tr>
      </table>
      <p style="text-align: center;"><button @click="buy" style="font-size: 24px">
      <code> &nbsp;Buy!</code></button>
      </p>
    </div>
    <div v-else>
      <table style="margin: auto">
      <tr><td><code>Sell Price ({{moneySymbol}}): </code></td>
      <td><input v-model="sellPrice" type="number"></td></tr>
      <tr><td><code>Sell Amount ({{stockSymbol}}): </code></td>
      <td><input v-model="sellAmount" type="number"></td></tr>
      </table>
      <p style="text-align: center;"><button @click="sell" style="font-size: 24px">
      <code> Sell!</code></button>
      </p>
    </div>
    <hr/>
  </div>
</template>

<script>
function alertNoMemos() {
  alert("You have not written any memo yet")
}

export default {
  data() {
    return {
      buyAmount: 0,
      sellAmount: 0,
      buyPrice: 0,
      sellPrice: 0,
      stockSymbol: "",
      moneySymbol: "",
      stockAmount: 0,
      moneyAmount: 0,
      stockURL: "",
      moneyURL: "",
      picked: 'Buy',
      hasCurrentMarket: false
    }
  },
  methods: {
     toBuy() {
       this.picked="Buy"
     },
     toSell() {
       this.picked="Sell"
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
    this.hasCurrentMarket = (currMarket !== null);
    if(this.hasCurrentMarket) {
      const marketArr = currMarket.split(",")
      this.stockSymbol = marketArr[0]
      this.moneySymbol = marketArr[1]
      const stockAddr = marketArr[2]
      const moneyAddr = marketArr[3]
      this.stockURL = "https://www.smartscan.cash/address/"+stockAddr
      this.moneyURL = "https://www.smartscan.cash/address/"+moneyAddr

      const stockContract = new ethers.Contract(stockAddr, SEP20ABI, provider)
      const moneyContract = new ethers.Contract(moneyAddr, SEP20ABI, provider)
      try {
	var balanceAmt = await stockContract.balanceOf(this.myAddress)
        var decimals = await stockContract.decimals()
        this.stockAmount = ethers.utils.formatUnits(balanceAmt, decimals)
	balanceAmt = await moneyContract.balanceOf(this.myAddress)
        decimals = await moneyContract.decimals()
        this.moneyAmount = ethers.utils.formatUnits(balanceAmt, decimals)
      } catch(e) {
        console.log(e)
      }
    } else {
      alert("You have set current market! Please enter a market first before exchanging coins.")
    }
  }
}
</script>
