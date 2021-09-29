function binarySearch(sortedArray, key){
    let start = 0;
    let end = sortedArray.length - 1;

    while (start <= end) {
        let middle = Math.floor((start + end) / 2);

        if (sortedArray[middle] === key) {
            return middle;
        } else if (sortedArray[middle] < key) {
            start = middle + 1;
        } else {
            end = middle - 1;
        }
    }

    return start;
}

//function tickToPrice(tick) {
//  X = [16777216, 16893910, 17011417, 17129740, 17248887, 17368863, 17489673, 17611323, 17733819, 17857168]
//  Y = [16777216, 17981375, 19271960, 20655176, 22137669, 23726566, 25429504, 27254668, 29210830, 31307392]
//  const shift = tick/100
//  const tail = tick%100
//  var price = Y[tail/10] * X[tail%10]
//  return price * Math.pow(2, shift) / Math.pow(10,26)
//}

const BASE = 37688464.0
const ALPHA = 1.0069555500567189

function unpackPrice(packedPrice) {
  var tick = (packedPrice>>19)&0x1FFF // 13 bits
  const shift = Math.floor(tick/100)
  var adjust = 1.0 * (packedPrice & 0x7FFFF) // 19 bits
  var X = [16777216, 16893910, 17011417, 17129740, 17248887, 17368863, 17489673, 17611323, 17733819, 17857168]
  var Y = [16777216, 17981375, 19271960, 20655176, 22137669, 23726566, 25429504, 27254668, 29210830, 31307392]
  const tail = (tick%100)|0x0
  var beforeAdjust = 1.0 * (Y[Math.floor(tail/10)] * X[tail%10])
  const priceBase = beforeAdjust * (BASE + adjust) / BASE
  const price = priceBase * Math.pow(2.0, shift) / Math.pow(10.0, 26)
  //console.log("shift ", shift, "tick ", tick, "beforeAdjust", beforeAdjust, "priceBase", priceBase, "price", price)
  return price
}

function getPriceList() {
  var res = []
  for (var i=0; i<7901; i+=10) {
  	res.push(unpackPrice(i<<19))
  }
  return res
}

var PriceList = getPriceList()

//function printPriceList() {
//  for (var i=0; i<PriceList.length; i++) {
//  	console.log(PriceList[i])
//  }
//}

function estimateTick(price) {
  var idx = binarySearch(PriceList, price)
  if(idx >= PriceList.length) {
    idx = PriceList.length-1
  }
  if(PriceList[idx]>price) {
    idx--;
  }
  //console.log("idx ", idx, "in-table ", PriceList[idx], "price", price)
  return idx;
}

function packPrice(price) {
  const idx = estimateTick(price)
  var tick = idx*10;
  var startPrice = PriceList[idx]
  while(true) {
    const newPrice = startPrice*ALPHA
    if(newPrice > price) {
      break
    }
    startPrice = newPrice
    tick++
  }
  var delta = (price - startPrice) / price
  var adjust = delta*BASE
  maxAdjust = Math.pow(2.0, 19) - 1.0
  if(adjust > maxAdjust) {
    adjust = maxAdjust
  }
  //console.log("tick ", tick, "startPrice", startPrice, "price", price, "delta", delta, "adjust", adjust)
  var hi = (tick&0x1FFF)<<19
  var lo = adjust&0x7FFFF
  return (hi | lo)
}
