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
    <br/>
    <div v-if="picked=='Buy'">
      <table style="margin: auto">
      <tr><td><code>&nbsp;Buy Price ({{moneySymbol}}): </code></td>
      <td><input v-model="buyPrice" type="number"></td></tr>
      <tr><td><code>&nbsp;Buy Amount ({{stockSymbol}}): </code></td>
      <td><input v-model="buyAmount" type="number"></td></tr>
      </table>
      <p style="text-align: center"><button @click="buy"><code> &nbsp;Buy!</code></button>
      </p>
    </div>
    <div v-else>
      <table style="margin: auto">
      <tr><td><code>Sell Price ({{moneySymbol}}): </code></td>
      <td><input v-model="sellPrice" type="number"></td></tr>
      <tr><td><code>Sell Amount ({{stockSymbol}}): </code></td>
      <td><input v-model="sellAmount" type="number"></td></tr>
      </table>
      <p style="text-align: center"><button @click="buy"><code> Sell!</code></button>
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
      stockURL: "",
      moneyURL: "",
      picked: 'Buy',
      hasCurrentMarket: false
    }
  },
  methods: {
     toBuy() {
       this.picked="buy"
     },
     toSell() {
       this.picked="sell"
     }
  },
  async mounted() {
    const currMarket = localStorage.getItem('currMarket');
    this.hasCurrentMarket = (currMarket !== null);
    if(this.hasCurrentMarket) {
      const marketArr = currMarket.split(",")
      this.stockSymbol = marketArr[0]
      this.moneySymbol = marketArr[1]
      this.stockURL = "https://www.smartscan.cash/address/"+marketArr[2]
      this.moneyURL = "https://www.smartscan.cash/address/"+marketArr[3]
    } else {
      alert("You have set current market! Please enter a market first before exchanging coins.")
    }
  }
}
</script>
