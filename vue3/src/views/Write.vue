<template>
  <h1>Write a New Memo</h1>
  <div class="normal">
   <textarea v-model="memo" style="width: 100%;" placeholder="Please write your memo here" rows="15" cols="160"></textarea>
    <p style="text-align: right"><button @click="save">Save</button></p>
    <!--
    <p><button @click="queryEvent">queryEvent</button></p>
    <p><button @click="deployLogic">deployLogic</button></p>
    <p><button @click="deployFactory">deployFactory</button></p>
    -->
  </div>
</template>

<style>
textarea {
    font-size:24px;
}
p {
    text-align: center;
}
button {
    font-size:24px;
    width: 120px;
}
</style>

<script>
const FactoryABI = [
  "function create(bytes memo) external",
  "event MemoContractCreated(address indexed owner, address indexed addr)"]

async function deploy(bytecode) {
  const abi = [ "constructor() public" ];
  
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  try {
    const signer = provider.getSigner()
    const factory = new ethers.ContractFactory(abi, bytecode, signer)
    const contract = await factory.deploy();
    console.log("address:", contract.address)
    const receipt = await contract.deployTransaction.wait();
    console.log(receipt)
  } catch(e) {
    alert("Error! "+e.toString())
  }
}

async function getPublicKey() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const encryptionPublicKey = await window.ethereum.request({
    method: 'eth_getEncryptionPublicKey',
    params: [accounts[0]]
  })
  return encryptionPublicKey
}

async function encryptMsg(msg) {
  const encryptionPublicKey = await getPublicKey()
  //const hex = base64ToHex(encryptionPublicKey)
  //alert("encryptionPublicKey "+hex.length+" "+hex)
  return encryptMsgWithKey(msg, encryptionPublicKey)
}

export default {
  data() {
    return {
      memo: ""
    }
  },
  methods: {
    async deployLogic() {
      await deploy(window.logicBytecode)
    },
    async deployFactory() {
      await deploy(window.factoryBytecode)
    },
    async queryEvent() {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const facContract = new ethers.Contract(FactoryAddress, FactoryABI, provider)
      const filter = facContract.filters.MemoContractCreated(null, null)
      console.log(await facContract.queryFilter(filter))
    },
    async save() {
      if (typeof window.ethereum === 'undefined') {
        alertNoWallet()
        return
      }
      if (this.memo.length == 0) {
        alert("You have not written any memo yet")
	return
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const myMemoAddress = getMyContract(await signer.getAddress())
      const code = await provider.getCode(myMemoAddress)
      //const encoder = new TextEncoder()
      //const fullMemo = encoder.encode((new Date()).toISOString() + " " + this.memo)
      const fullMemo = await encryptMsg((new Date()).toISOString() + " " + this.memo)
      var gasPrice = await provider.getStorageAt("0x0000000000000000000000000000000000002710","0x00000000000000000000000000000000000000000000000000000000000000002")
      if(gasPrice=="0x") {
        gasPrice = "0x0"
      }
      if(code.length <= 2) { //contract not created
        const facContract = new ethers.Contract(FactoryAddress, FactoryABI, provider)
        const receipt = await facContract.connect(signer).create(fullMemo, {gasPrice: gasPrice})
      } else {
        const memoContract = new ethers.Contract(myMemoAddress, MemoABI, provider)
        await memoContract.connect(signer).addMemo(fullMemo, {gasPrice: gasPrice}) 
      }
    },
  }
}
</script>
