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
      <td><input v-model="moneyAmount" type="number"></td></tr>
      <tr><td><code>Stock Amount ({{stockSymbol}}): </code></td>
      <td><input v-model="stockAmount" type="number"></td></tr>
      </table>
      <p style="text-align: center"><button @click="buy" style="font-size: 20px">
      <code>Place Grid Orders</code></button></p>
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
      moneyAmount: 0,
      stockAmount: 0,
      highPrice: 0,
      lowPrice: 0,
      stockSymbol: "",
      moneySymbol: "",
      stockURL: "",
      moneyURL: "",
      hasCurrentMarket: false
    }
  },
  methods: {
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
