<template>
  <div class="normal">
    <h3 v-if="hasCurrentMarket">Current Market: <code><a v-bind:href="stockURL">{{stockSymbol}}</a>/<a v-bind:href="moneyURL">{{moneySymbol}}</a></code></h3>
    <h3 v-else>Current Market: [Not Set]</h3>
    If you want to enter a market, please specify its stock and money:<br/>
    <code>Stock:&nbsp;</code><input v-model="stockToken" type="text" placeholder="Please enter an address in HEX format"><br/>
    <code>Money:&nbsp;</code><input v-model="moneyToken" type="text" placeholder="Please enter an address in HEX format">
    &nbsp;<button @click="enterMarket" style="font-size: 20px;">Enter</button><br/>
    <hr/>
    <button @click="unsetCurr" style="font-size:20px; width: 280px;">unset current market</button><br/>
    <p v-if="hasHistory">Here are some markets you have entered before:</p>
    <table>
    <template v-for="(entry, idx) in markets" :keys="entry.fullInfo">
      <tr><td>
      <code><a v-bind:href="entry.stockURL">{{entry.stockSymbol}}</a>/<a v-bind:href="entry.moneyURL">{{entry.moneySymbol}}</a></code>&nbsp;</td><td>
      <button @click="enter" v-bind:name="entry.fullInfo"
      style="font-size:20px; width: 80px;">enter</button>&nbsp;
      <button @click="remove" v-bind:name="entry.fullInfo"
      style="font-size:20px; width: 80px;">remove</button>
      </td></tr>
    </template>
    </table>
  </div>
</template>

<style>
h3 {
    text-align: center;
}
input {
    font-size:20px;
    width:500px;
}
</style>

<script>
export default {
  data() {
    return {
      hasCurrentMarket: false,
      stockURL: "",
      moneyURL: "",
      stockSymbol: "",
      moneySymbol: "",
      hasHistory: false,
      stockToken: "",
      moneyToken: "",
      markets: []
    }
  },
  methods: {
    async enterMarket() {
      if (typeof window.ethereum === 'undefined') {
        alertNoWallet()
        return
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      try {
        this.stockAddr = ethers.utils.getAddress(this.stockToken)
        const stockContract = new ethers.Contract(this.stockAddr, SEP20ABI, provider)
        this.stockSymbol = await stockContract.symbol()
      } catch(e) {
        alert("Error when reading the stock token's symbols. Maybe "+stockAddr+" is not a SEP20 token's address?")
	console.log(e)
      }
      try {
        this.moneyAddr = ethers.utils.getAddress(this.moneyToken)
        const moneyContract = new ethers.Contract(this.moneyAddr, SEP20ABI, provider)
        this.moneySymbol = await moneyContract.symbol()
      } catch(e) {
        alert("Error when reading the money token's symbols. Maybe "+moneyAddr+" is not a SEP20 token's address?")
	console.log(e)
      }
      var marketStr = this.stockSymbol+","+this.moneySymbol+","+this.stockAddr+","+this.moneyAddr
      localStorage.setItem('currMarket', marketStr)
      localStorage.setItem(marketStr, Math.floor(Date.now()/1000))
      this.hasCurrentMarket = true
      alert("Now, the current market is "+this.stockSymbol+"/"+this.moneySymbol)
    },
    async unsetCurr() {
      localStorage.removeItem('currMarket')
    },
    async enter(event) {
      const marketStr = event.target.name
      localStorage.setItem('currMarket', marketStr)
      localStorage.setItem(marketStr, Math.floor(Date.now()/1000))
      const marketArr = marketStr.split(",")
      this.stockSymbol = marketArr[0]
      this.moneySymbol = marketArr[1]
      this.stockURL = "https://www.smartscan.cash/address/"+marketArr[2]
      this.moneyURL = "https://www.smartscan.cash/address/"+marketArr[3]
      this.hasCurrentMarket = true
      alert("Now, the current market is "+this.stockSymbol+"/"+this.moneySymbol)
    },
    async remove(event) {
      const marketArr = event.target.name.split(",")
      const ok = confirm("Are you sure to remove "+marketArr[0]+"/"+marketArr[1]+" from the history records?")
      if(!ok) {
        return
      }
      for(var i=0; i<this.markets.length; i++) {
        if(this.markets[i].fullInfo==event.target.name) {
          this.markets.splice(i, 1)
	  break
	}
      }
      localStorage.removeItem(event.target.name)
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
    }

    this.hasHistory = localStorage.length > 1
    var markets = []
    for(var i=0; i<localStorage.length; i++) {
      const marketStr = localStorage.key(i)
      if(marketStr == 'currMarket') {
        continue
      }
      var timestamp = localStorage.getItem(marketStr)
      const marketArr = marketStr.split(",")
      var entry = {
        stockSymbol: marketArr[0],
        moneySymbol: marketArr[1],
        stockURL: "https://www.smartscan.cash/address/"+marketArr[2],
        moneyURL: "https://www.smartscan.cash/address/"+marketArr[3],
        fullInfo: marketStr,
	timestamp: timestamp
      }
      markets.push(entry)
    }
    console.log(markets)
    markets.sort(function(a,b) {
      return b.timestamp - a.timestamp
    })
    console.log(markets)
    this.markets = markets
  }
}
</script>
