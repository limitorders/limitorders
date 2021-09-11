import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'


/*

 */

window.FactoryAddress = "0x8cbF0be6e54f79699e7fDf9fa77B7FA910e22d30"

window.ISODateExample = "2009-01-03T06:15:00.000Z"

window.logicBytecode = ""

window.proxyCode = ""

window.factoryBytecode = ""


window.SEP20ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"]

window.alertNoWallet = () => {
      alert("No wallet installed! Please install MetaMask or other web3 wallet to use this App.");
}

window.getMyContract = function(addr) {
  const addr32 = ethers.utils.hexZeroPad(addr, 32)
  const deployCode = window.proxyCode+addr32.substr(2) // using substr to skip 0x
  const deployCodeHash = ethers.utils.keccak256(deployCode)
  return ethers.utils.getCreate2Address(window.FactoryAddress, ethers.utils.hexZeroPad("0x0", 32), deployCodeHash);
}

if (typeof window.ethereum === 'undefined') {
  alertNoWallet()
} else {
  ethereum.request({ method: 'eth_requestAccounts' })
}

createApp(App).use(router).mount('#app')

