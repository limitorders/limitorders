<template>
  <div v-if="hasCurrentMarket" class="normal">
    <h3>Current Market: <code><a v-bind:href="stockURL">{{stockSymbol}}</a>/<a v-bind:href="moneyURL">{{moneySymbol}}</a></code></h3>
    <p style="text-align: center">My Address: {{myAddress}}<br>
    My Balances: {{stockAmount}} {{stockSymbol}}; {{moneyAmount}} {{moneySymbol}}</p>
    <p style="font-size: 8px">&nbsp;</p>
    <p style="text-align: center;">
      <input type="radio" id="buy" value="Buy" v-model="picked" style="width: 50px">
      <label for="buy" @click="toBuy" v-bind:style="picked=='Buy'? 'font-weight: bold; text-decoration: underline;': ''">
      I Want to Buy {{stockSymbol}}</label>
      <span style="color: lightgrey;">&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <input type="radio" id="sell" value="Sell" v-model="picked" style="width: 50px">
      <label for="sell" @click="toSell" v-bind:style="picked=='Sell'? 'font-weight: bold; text-decoration: underline;': ''">
      I Want to Sell {{stockSymbol}}</label>
    </p>
    <p style="font-size: 8px">&nbsp;</p>
    <div v-if="picked=='Buy'">
      <table style="margin: auto">
      <tr><td><span style="font-family: monospace;">&nbsp;Buy Price ({{moneySymbol}}): </span></td>
      <td><input class="narrowinput" v-model="buyPrice" type="number"></td></tr>
      <tr><td><span style="font-family: monospace;">&nbsp;Buy Amount ({{stockSymbol}}): </span></td>
      <td><input class="narrowinput" v-model="buyAmount" type="number"></td></tr>
      </table>
      <p style="font-size: 8px">&nbsp;</p>
      <p style="text-align: center;"><button class="button is-info" @click="buy" style="font-size: 24px">
      <span style="font-family: monospace;"> &nbsp;Buy!</span></button>
      </p>
    </div>
    <div v-else>
      <table style="margin: auto">
      <tr><td><span style="font-family: monospace;">Sell Price ({{moneySymbol}}): </span></td>
      <td><input class="narrowinput" v-model="sellPrice" type="number"></td></tr>
      <tr><td><span style="font-family: monospace;">Sell Amount ({{stockSymbol}}): </span></td>
      <td><input class="narrowinput" v-model="sellAmount" type="number"></td></tr>
      </table>
      <p style="font-size: 8px">&nbsp;</p>
      <p style="text-align: center;"><button class="button is-info" @click="sell" style="font-size: 24px">
      <span style="font-family: monospace;"> Sell!</span></button>
      </p>
    </div>
    <hr/>
    <p style="text-align: center;"><button class="button is-info is-light" @click="showDepth" style="font-size: 22px">
    Show Depth Graphs</button></p>
    <p style="font-size: 8px">&nbsp;</p>
    <div id="sell_depth"></div>
    <div id="buy_depth"></div>
  </div>
</template>

<script>
function alertNoMemos() {
  alert("You have not written any memo yet")
}

function getSellOrdersToDealWith(sellOrders, buyAmount, maxPrice) {
  var indexAndTickList = []
  var estimatedAmount = 0.0
  buyAmount = buyAmount*1.5 //Add some margin
  for(var i=0; i<sellOrders.length; i++) {
    if(sellOrders[i].highPrice > maxPrice || estimatedAmount > buyAmount) {
      break
    }
    if(sellOrders[i].stockAmount == 0) {
      continue
    }
    console.log("sellOrder", sellOrders[i])
    console.log("estimatedAmount", estimatedAmount, "buyAmount", buyAmount)
    indexAndTickList.push(sellOrders[i].indexAndTick)
    estimatedAmount += sellOrders[i].stockAmount
  }
  return [indexAndTickList, estimatedAmount]
}

function getBuyOrdersToDealWith(buyOrders, sellAmount, minPrice) {
  var indexAndTickList = []
  var estimatedAmount = 0.0
  sellAmount = sellAmount*1.5 //Add some margin
  for(var i=0; i<buyOrders.length; i++) {
    console.log("HERE",buyOrders[i].lowPrice, minPrice, estimatedAmount, sellAmount)
    if(buyOrders[i].lowPrice < minPrice || estimatedAmount > sellAmount) {
      break
    }
    if(buyOrders[i].moneyAmount == 0) {
      continue
    }
    console.log("buyOrder", buyOrders[i])
    indexAndTickList.push(buyOrders[i].indexAndTick)
    estimatedAmount += (buyOrders[i].moneyAmount/buyOrders[i].lowPrice)
  }
  return [indexAndTickList, estimatedAmount]
}

function packOrderPosList(indexAndTickList) {
  var orderPosList = []
  var m = 0n
  var count = 0
  for(var i=0; i<indexAndTickList.length; i++) {
    m = (m<<48n) | BigInt(indexAndTickList[i])
    count++
    if(count==5) {
      count = 0
      m = 0n
      orderPosList.push(ethers.BigNumber.from(m))
    }
  }
  if(m != 0n) {
    orderPosList.push(ethers.BigNumber.from(m))
  }
  console.log("packOrderPosList", indexAndTickList, orderPosList)
  return orderPosList
}

function drawDepthGraph(rows, id, yTitle) {
      var data = new google.visualization.DataTable();
      data.addColumn('number', 'Price');
      data.addColumn('number', yTitle);

      console.log("drawDepthGraph", rows)
      data.addRows(rows)

      var options = {
        hAxis: {
          title: 'Price'
        },
        yAxis: {
          title: yTitle
        },
	pointSize: 2,
        series: {
          1: {curveType: 'none'}
        },
	legend: { position: 'top' }
      };

      var chart = new google.visualization.LineChart(document.getElementById(id));
      chart.draw(data, options);
}

async function updateDepth(marketAddress) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const marketContract = new ethers.Contract(marketAddress, ABI, provider)

  const maxOrderCount = 3000
  const sellMasks = await marketContract.getSellOrderMaskWords()
  var sellOrders = []
  for(var n=0; n<sellMasks.length; n++) {
    const mask = sellMasks[n].toBigInt()
    for(var j=0; j<256; j++) {
      if(((mask>>BigInt(j))&1n) != 0) {
        const tick = n*256+j
	const orderArrays = await marketContract.getSellOrders(tick, 0, 365)
        //console.log("orderArrays", orderArrays)
	var orders = []
	for(var i=0; i<orderArrays.length; i++) {
	  orders.push(orderArrayToObj(orderArrays[i], i*65536+tick))
	}
	orders.sort(function(a, b) {return a.highPrice - b.highPrice})
	for(var i=0; i<orders.length; i++) {
	  sellOrders.push(orders[i])
	}
      }
      if(sellOrders.length > maxOrderCount) {
        break
      }
    }
  }
  var totalSell = 0.0
  var sellDepth = []
  for(var i=0; i<sellOrders.length; i++) {
    totalSell += sellOrders[i].stockAmount
    sellDepth.push([sellOrders[i].highPrice, totalSell])
  }
  if(sellDepth.length > 0) {
    sellDepth.unshift([sellDepth[0][0] * 0.99, 0])
  }
  console.log("sellDepth", sellDepth)

  const buyMasks = await marketContract.getBuyOrderMaskWords()
  var buyOrders = []
  for(var n=buyMasks.length-1; n>0; n--) {
    const mask = buyMasks[n].toBigInt()
    for(var j=255; j>0; j--) {
      if(((mask>>BigInt(j))&1n) != 0) {
        const tick = n*256+j
        console.log("tick", tick)
	const orderArrays = await marketContract.getBuyOrders(tick, 0, 365)
        //console.log("orderArrays", orderArrays)
	var orders = []
	for(var i=0; i<orderArrays.length; i++) {
	  orders.push(orderArrayToObj(orderArrays[i], i*65536+tick))
	}
	orders.sort(function(a, b) {return b.highPrice - a.highPrice})
	for(var i=0; i<orders.length; i++) {
	  buyOrders.push(orders[i])
	}
      }
      if(buyOrders.length > maxOrderCount) {
        break
      }
    }
  }
  var totalBuy = 0.0
  var buyDepth = []
  for(var i=0; i<buyOrders.length; i++) {
    totalBuy += buyOrders[i].stockAmount
    buyDepth.unshift([buyOrders[i].lowPrice, totalBuy])
  }
  if(buyDepth.length > 0) {
    buyDepth.push([buyDepth[buyDepth.length-1][0] * 1.01, 0])
  }

  console.log("sellDepth2", sellDepth)
  drawDepthGraph(sellDepth, "sell_depth", "Sell Amount")
  drawDepthGraph(buyDepth, "buy_depth", "Buy Amount")

  return [sellOrders, buyOrders]
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
      moneyDecimals: 0,
      stockDecimals: 0,
      stockAmount: 0,
      moneyAmount: 0,
      stockAddr: "",
      moneyAddr: "",
      stockURL: "",
      moneyURL: "",
      marketAddress: "",
      sellOrders: [],
      buyOrders: [],
      picked: 'Buy',
      depthShown: false,
      hasCurrentMarket: false
    }
  },
  methods: {
     async showDepth() {
      [this.sellOrders, this.buyOrders] = await updateDepth(this.marketAddress)
      this.depthShown = true
     },
     async buy() {
       if(!this.depthShown) {
         [this.sellOrders, this.buyOrders] = await updateDepth(this.marketAddress)
       }
       var [indexAndTickList, estimatedAmount] = getSellOrdersToDealWith(this.sellOrders, this.buyAmount, this.buyPrice)
       if(indexAndTickList.length == 0) {
         alert("Find no sell order to deal with!")
	 return
       }
       var moneyNeeded = this.buyAmount*this.buyPrice
       const moneyAmountIn = await safeGetAmount(this.moneyAddr, this.moneySymbol, moneyNeeded,
       				this.moneyDecimals, this.marketAddress, 0)
       if(!moneyAmountIn) {
         return
       }
       var value = ethers.BigNumber.from(0)
       if(this.moneyAddr == SEP206Address) {
         value = moneyAmountIn
       }
       var maxPrice = ethers.utils.parseUnits(this.buyPrice.toString(), 26)
       var orderPosList = packOrderPosList(indexAndTickList)
       var twoPow96 = ethers.BigNumber.from(2).pow(96)
       var maxGotStock = ethers.utils.parseUnits(this.buyAmount.toString(), this.stockDecimals)
       console.log("moneyAmountIn", moneyAmountIn.toHexString())
       console.log("maxGotStock", maxGotStock.toHexString())
       var moneyAmountIn_maxGotStock = moneyAmountIn.mul(twoPow96).add(maxGotStock)

       const provider = new ethers.providers.Web3Provider(window.ethereum)
       const signer = provider.getSigner()
       const marketContract = new ethers.Contract(this.marketAddress, ABI, provider).connect(signer)
       var txResp = await marketContract.dealWithSellOrders(maxPrice, orderPosList,
                                          moneyAmountIn_maxGotStock, {value: value})
       const receipt = await txResp.wait(1)
       console.log("receipt.logs", receipt.logs)
     },
     async sell() {
       if(!this.depthShown) {
         [this.sellOrders, this.buyOrders] = await updateDepth(this.marketAddress)
       }
       var [indexAndTickList, estimatedAmount] = getBuyOrdersToDealWith(this.buyOrders, this.sellAmount, this.sellPrice)
       if(indexAndTickList.length == 0) {
         alert("Find no buy order to deal with!")
	 return
       }
       const stockAmountIn = await safeGetAmount(this.stockAddr, this.stockSymbol, this.sellAmount,
       				this.stockDecimals, this.marketAddress, 0)
       if(!stockAmountIn) {
         return
       }
       var value = ethers.BigNumber.from(0)
       if(this.stockAddr == SEP206Address) {
         value = stockAmountIn
       }
       var minPrice = ethers.utils.parseUnits(this.sellPrice.toString(), 26)
       var orderPosList = packOrderPosList(indexAndTickList)
       var twoPow96 = ethers.BigNumber.from(2).pow(96)
       var twoPow96Minus1 = twoPow96.sub(ethers.BigNumber.from(1))
       var stockAmountIn_maxGotMoney = stockAmountIn.mul(twoPow96).add(twoPow96Minus1)

       const provider = new ethers.providers.Web3Provider(window.ethereum)
       const signer = provider.getSigner()
       const marketContract = new ethers.Contract(this.marketAddress, ABI, provider).connect(signer)
       var txResp = await marketContract.dealWithBuyOrders(minPrice, orderPosList,
                                         stockAmountIn_maxGotMoney, {value: value})
       const receipt = await txResp.wait(1)
       console.log("receipt.logs", receipt.logs)
     },
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
    } else {
      alertNoCurrentMarket()
    }
  }
}
</script>
