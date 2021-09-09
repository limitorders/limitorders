// alpha = 1.0069555500567189 = 2**0.01;   alpha**100 = 2
// 0x40000/0.0069555500567189 = 37688464
// for i in range(10): print((1<<24)*(alpha**i))
const BASE = 37688464n;
const X = (16777216n<<(0n*25n))| //alpha*0
          (16893910n<<(1n*25n))| //alpha*1
          (17011417n<<(2n*25n))| //alpha*2
          (17129740n<<(3n*25n))| //alpha*3
          (17248887n<<(4n*25n))| //alpha*4
          (17368863n<<(5n*25n))| //alpha*5
          (17489673n<<(6n*25n))| //alpha*6
          (17611323n<<(7n*25n))| //alpha*7
          (17733819n<<(8n*25n))| //alpha*8
          (17857168n<<(9n*25n)); //alpha*9

// for i in range(10): print((1<<24)*(alpha**(i*10)))
const Y = (16777216n<<(0n*25n))| //alpha*0
          (17981375n<<(1n*25n))| //alpha*10
          (19271960n<<(2n*25n))| //alpha*20
          (20655176n<<(3n*25n))| //alpha*30
          (22137669n<<(4n*25n))| //alpha*40
          (23726566n<<(5n*25n))| //alpha*50
          (25429504n<<(6n*25n))| //alpha*60
          (27254668n<<(7n*25n))| //alpha*70
          (29210830n<<(8n*25n))| //alpha*80
          (31307392n<<(9n*25n)); //alpha*90

const MASK25 = (1n<<26n)-1n;
const MASK64 = (1n<<65n)-1n;

// return a number in the range [2.8147497671065605e-12, 2962330055567.072]
// maximum returned value: 17857168*31307392*(2**79)=fe3b4ed7d40000000000000000000000 < 2**128
module.exports.unpackPrice = function(packedPrice) {
    const priceTick = (packedPrice >> 19n) & 0x1FFFn; // 13 bits
    const adjust = packedPrice & 0x7FFFFn; // 19 bits
    const tail = priceTick % 100n;
    const beforeAdjust = ((Y>>((tail/10n)*25n))&MASK25) * ((X>>(tail%10n)*25n)&MASK25);
    const priceBase = (beforeAdjust * (BASE+adjust) / BASE) & 0xFFFFFFFFFFFFFFFFn;
    return [priceBase, priceTick];
}

module.exports.packPrice = function(price) {
    // TODO
}
