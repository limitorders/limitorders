import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'

window.SEP206Address = "0x0000000000000000000000000000000000002711"

window.logicBytecode = "0x608060405234801561001057600080fd5b506123f0806100206000396000f3fe6080604052600436106100fe5760003560e01c8063adbade9b11610095578063c7efbe3611610064578063c7efbe36146102a1578063c885bc58146102c1578063e3f7477e146102d6578063e6b03a51146103c8578063fa1da012146103db57600080fd5b8063adbade9b1461022e578063ba19863e1461024e578063bdf3c4ae14610261578063c45a01551461028157600080fd5b80636ae9c433116100d15780636ae9c4331461019f578063790e5453146101b45780639211555c146101e15780639c65a1701461020e57600080fd5b806309650c1614610103578063137ee36e1461012e5780634ddd108a146101525780635fd5f1361461018a575b600080fd5b34801561010f57600080fd5b50610118610408565b6040516101259190612074565b60405180910390f35b34801561013a57600080fd5b5061014460045481565b604051908152602001610125565b34801561015e57600080fd5b50600154610172906001600160a01b031681565b6040516001600160a01b039091168152602001610125565b61019d610198366004611f1f565b61045e565b005b3480156101ab57600080fd5b5061011861060a565b3480156101c057600080fd5b506101d46101cf366004611fa3565b61065c565b604051610125919061200a565b3480156101ed57600080fd5b506102016101fc366004611eed565b610686565b60405161012591906120ce565b34801561021a57600080fd5b506101d4610229366004611fa3565b610733565b34801561023a57600080fd5b5061019d610249366004611eed565b61074c565b61019d61025c366004611f1f565b610bed565b34801561026d57600080fd5b50600054610172906001600160a01b031681565b34801561028d57600080fd5b50600254610172906001600160a01b031681565b3480156102ad57600080fd5b506101d46102bc366004611db0565b610dc6565b3480156102cd57600080fd5b5061019d610dec565b3480156102e257600080fd5b506103666102f1366004611eed565b613dfb60205260009081526040902080546001909101546001600160401b0380831692600160401b81049091169161ffff600160801b8304811692600160901b81049091169163ffffffff600160a01b8304811692600160c01b900416906001600160601b0380821691600160601b90041688565b604080516001600160401b03998a16815298909716602089015261ffff9586169688019690965293909216606086015263ffffffff90811660808601521660a08401526001600160601b0390811660c08401521660e082015261010001610125565b61019d6103d6366004611eed565b610e91565b3480156103e757600080fd5b506103fb6103f6366004611e07565b611255565b60405161012591906120a6565b610410611cb2565b60005b601f81101561045a57600581601f811061042f5761042f612376565b01548282601f811061044357610443612376565b602002015280610452816122e4565b915050610413565b5090565b60008054606083901c916001600160601b03841691610489906001600160a01b0316338560016112d8565b6001600160601b03169050806000805b8781101561052f5760005b60d081101561051c57846104b75761051c565b6000818b8b858181106104cc576104cc612376565b90506020020135901c90508065ffffffffffff16600014156104ee575061051c565b6105038c8265ffffffffffff1689898861152b565b90965093506105159050603082612174565b90506104a4565b5080610527816122e4565b915050610499565b5060006103e86105408360026122ae565b61054a91906121ad565b9050806004600082825461055e9190612174565b9091555050600154610583906001600160a01b03163361057e84866122cd565b611715565b60005461059a906001600160a01b03163386611715565b60006105a685856122cd565b9050600042604085901b60a084901b17179050336001600160a01b03167fb377d39ea6d787b02977d12053054788647bf39350be5cc237855bc1ca51143d826040516105f491815260200190565b60405180910390a2505050505050505050505050565b610612611cb2565b60005b601f81101561045a57602481601f811061063157610631612376565b01548282601f811061064557610645612376565b602002015280610654816122e4565b915050610615565b606061067e611f1f85611edc811061067657610676612376565b018484611823565b949350505050565b61068e611cd1565b506000908152613dfb602090815260409182902082516101008101845281546001600160401b038082168352600160401b8204169382019390935261ffff600160801b8404811694820194909452600160901b8304909316606084015263ffffffff600160a01b830481166080850152600160c01b90920490911660a0830152600101546001600160601b0380821660c0840152600160601b9091041660e082015290565b606061067e604385611edc811061067657610676612376565b336000908152600360205260408120805490919082908490811061077257610772612376565b90600052602060002001549050600061078a82610686565b9050806040015161ffff16600014156107da5760405162461bcd60e51b815260206004820152600d60248201526c373796b9bab1b416b7b93232b960991b60448201526064015b60405180910390fd5b60006043826060015161ffff16611edc81106107f8576107f8612376565b0190506000611f1f836040015161ffff16611edc811061081a5761081a612376565b01905060008084608001518560a0015163ffffffff16915063ffffffff16915083828154811061084c5761084c612376565b906000526020600020015486146108965760405162461bcd60e51b815260206004820152600e60248201526d0eee4dedcce5ae6cad8d85ad2c8f60931b60448201526064016107d1565b8281815481106108a8576108a8612376565b906000526020600020015486146108f15760405162461bcd60e51b815260206004820152600d60248201526c0eee4dedcce5ac4eaf25ad2c8f609b1b60448201526064016107d1565b6000868152613dfb6020526040902080546001600160e01b031916815560010180546001600160c01b03191690558654879061092f906001906122cd565b8154811061093f5761093f612376565b906000526020600020015487898154811061095c5761095c612376565b60009182526020822001919091558454610978906001906122cd565b90508083146109e957600085828154811061099557610995612376565b90600052602060002001549050808685815481106109b5576109b5612376565b906000526020600020018190555060006109ce82610686565b63ffffffff8616608082015290506109e68282611916565b50505b83546109f7906001906122cd565b9050808214610a68576000848281548110610a1457610a14612376565b9060005260206000200154905080858481548110610a3457610a34612376565b90600052602060002001819055506000610a4d82610686565b63ffffffff851660a08201529050610a658282611916565b50505b87805480610a7857610a78612360565b6001900381819060005260206000200160009055905584805480610a9e57610a9e612360565b6001900381819060005260206000200160009055905583805480610ac457610ac4612360565b6000828152602081208201600019908101919091550190558454610b39576000806101008860600151610af7919061218c565b6101008960600151610b0991906122ff565b61ffff16915061ffff169150806001901b19600583601f8110610b2e57610b2e612376565b018054909116905550505b8354610b96576000806101008860400151610b54919061218c565b6101008960400151610b6691906122ff565b61ffff16915061ffff169150806001901b19602483601f8110610b8b57610b8b612376565b018054909116905550505b60005460c0870151610bbc916001600160a01b03169033906001600160601b0316611715565b60015460e0870151610be2916001600160a01b03169033906001600160601b0316611715565b505050505050505050565b60018054606083901c916001600160601b03841691600091610c1c916001600160a01b031690339086906112d8565b6001600160601b0316905060006103e8610c378360026122ae565b610c4191906121ad565b90506000610c4f82846122cd565b9050806000805b89811015610cf85760005b60d0811015610ce557831580610c7657508783145b15610c8057610ce5565b6000818d8d85818110610c9557610c95612376565b90506020020135901c90508065ffffffffffff1660001415610cb75750610ce5565b610ccc8e8265ffffffffffff168b8888611a1c565b9095509350610cde9050603082612174565b9050610c61565b5080610cf0816122e4565b915050610c56565b506000610d0583856122cd565b9050600084610d1483886122ae565b610d1e91906121ad565b600054909150610d38906001600160a01b03163385611715565b600154610d5e906001600160a01b03163383610d548a89612174565b61057e91906122cd565b8060046000828254610d709190612174565b9091555050604080514284831b60a087901b1717808252915133917f8e12807666f0f51c7970fe00d8e03270bd01ae9701badb92d1147644ef21cafc919081900360200190a25050505050505050505050505050565b6001600160a01b038316600090815260036020526040902060609061067e908484611823565b60025460408051622fcfcb60e31b815290516000926001600160a01b03169163017e7e5891600480830192602092919082900301818787803b158015610e3157600080fd5b505af1158015610e45573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e699190611d8c565b600154600454919250610e89916001600160a01b03909116908390611715565b506000600455565b63ffffffff80821690602083901c16818111610ed85760405162461bcd60e51b815260206004820152600660248201526548693c3d4c6f60d01b60448201526064016107d1565b81610f175760405162461bcd60e51b815260206004820152600f60248201526e7a65726f2d70726963652d7469636b60881b60448201526064016107d1565b610f1f611cd1565b610f2883611bd5565b61ffff1660408301526001600160401b03168152610f4582611bd5565b61ffff1660608301526001600160401b031660208201526001600160601b03604085901c1660c0820181905260a085901c60e0830152151580610f94575060e08101516001600160601b031615155b610fce5760405162461bcd60e51b815260206004820152600b60248201526a1e995c9bcb585b5bdd5b9d60aa1b60448201526064016107d1565b600080546001600160a01b031661271114801590610ff957506001546001600160a01b031661271114155b905061102760008054906101000a90046001600160a01b0316338460c001516001600160601b0316846112d8565b6001600160601b0390811660c084015260015460e0840151611058926001600160a01b0390921691339116846112d8565b6001600160601b031660e08301523360601b4360201b175b61107981610686565b602001516001600160401b03161561109d5780611095816122e4565b915050611070565b33600090815260036020908152604082208054600181018255818452918320909101839055606085015190919060439061ffff16611edc81106110e2576110e2612376565b0190506000611f1f866040015161ffff16611edc811061110457611104612376565b835463ffffffff90811660808a01529101805490911660a0880152905061112b8487611916565b8154600181810184556000848152602080822090930187905583548083018555848252929020909101859055825414156111b5576000806101008860600151611174919061218c565b610100896060015161118691906122ff565b61ffff16915061ffff169150806001901b600583601f81106111aa576111aa612376565b018054909117905550505b8054600114156112155760008061010088604001516111d4919061218c565b61010089604001516111e691906122ff565b61ffff16915061ffff169150806001901b602483601f811061120a5761120a612376565b018054909117905550505b60405189815233907f82ea020c83bbe07a91831294c36bea763d660fc1ab474ea81784aa532558a22e9060200160405180910390a2505050505050505050565b61125d611d15565b81815260408301516112759060649061ffff166121ad565b83516001600160401b0316901b6020820152606083015161129c9060649061ffff166121ad565b60208401516001600160401b0316901b604082015260c08301516001600160601b03908116606083015260e09093015190921660808301525090565b6000826112e75750600061067e565b826001600160a01b03861661271114156113405783341461133b5760405162461bcd60e51b815260206004820152600e60248201526d0ecc2d8eaca5adad2e6dac2e8c6d60931b60448201526064016107d1565b611522565b82158061134b575034155b6113875760405162461bcd60e51b815260206004820152600d60248201526c0c8dedce85ae6cadcc85ac4c6d609b1b60448201526064016107d1565b6040516370a0823160e01b81523060048201526000906001600160a01b038816906370a082319060240160206040518083038186803b1580156113c957600080fd5b505afa1580156113dd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114019190611f06565b6040516323b872dd60e01b81526001600160a01b03888116600483015230602483015260448201889052919250908816906323b872dd90606401602060405180830381600087803b15801561145557600080fd5b505af1158015611469573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061148d9190611de5565b506040516370a0823160e01b81523060048201526000906001600160a01b038916906370a082319060240160206040518083038186803b1580156114d057600080fd5b505afa1580156114e4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115089190611f06565b905061151482826122cd565b6001600160601b0316925050505b95945050505050565b60008061ffff8616601087901c82611f1f83611edc811061154e5761154e612376565b01805490915082106115685786869450945050505061170b565b600081838154811061157c5761157c612376565b90600052602060002001549050600061159482610686565b905060006064826040015161ffff166115ad91906121ad565b82516001600160401b0316901b90508c8110156115d55789899750975050505050505061170b565b6000816115e4601a600a612204565b8460e001516001600160601b03166115fc91906122ae565b61160691906121ad565b90506000808c831161162857505060e08301516001600160601b03168161164e565b611634601a600a612204565b61163e858f6122ae565b61164891906121ad565b91508c90505b600061165a838e612174565b90508e811115611699578c8f61167091906122cd565b92508461167f601a600a612204565b61168990856122ae565b61169391906121ad565b91508e90505b9b508b6116a6828f6122cd565b9d50818660c001516001600160601b03166116c19190612174565b6001600160601b0390811660c088015260e08701516116e2918591166122cd565b6001600160601b031660e08701526116fa8787611916565b8d8d9b509b50505050505050505050505b9550959350505050565b8061171f57505050565b6040516001600160a01b03838116602483015260448201839052600091829186169060640160408051601f198184030181529181526020820180516001600160e01b031663a9059cbb60e01b179052516117799190611fcf565b6000604051808303816000865af19150503d80600081146117b6576040519150601f19603f3d011682016040523d82523d6000602084013e6117bb565b606091505b50915091506000818060200190518101906117d69190611de5565b90508280156117e25750805b61181b5760405162461bcd60e51b815260206004820152600a6024820152691d1c985b9ccb59985a5b60b21b60448201526064016107d1565b505050505050565b825460609082111561183457835491505b61183e83836122cd565b6001600160401b038111156118555761185561238c565b60405190808252806020026020018201604052801561188e57816020015b61187b611d15565b8152602001906001900390816118735790505b509050825b8281101561190e5760008582815481106118af576118af612376565b9060005260206000200154905060006118c782610686565b90506118d38183611255565b846118de88866122cd565b815181106118ee576118ee612376565b602002602001018190525050508080611906906122e4565b915050611893565b509392505050565b6000918252613dfb60209081526040928390208251815492840151948401516060850151608086015160a08701516001600160401b039485166fffffffffffffffffffffffffffffffff1990971696909617600160401b94909816939093029690961763ffffffff60801b1916600160801b61ffff9283160261ffff60901b191617600160901b91909616029490941767ffffffffffffffff60a01b1916600160a01b63ffffffff9586160263ffffffff60c01b191617600160c01b949092169390930217825560c08101516001909201805460e0909201516001600160601b039384166001600160c01b031990931692909217600160601b9390921692909202179055565b60008061ffff8616601087901c82604383611edc8110611a3e57611a3e612376565b0180549091508210611a585786869450945050505061170b565b6000818381548110611a6c57611a6c612376565b906000526020600020015490506000611a8482610686565b905060006064826060015161ffff16611a9d91906121ad565b82602001516001600160401b0316901b90508c811115611ac85789899750975050505050505061170b565b6000611ad6601a600a612204565b60c0840151611aee906001600160601b0316846122ae565b611af891906121ad565b90506000808c8311611b1b57505060c083015181906001600160601b0316611b42565b8c915083611b2b601a600a612204565b611b35908f6122ae565b611b3f91906121ad565b90505b6000611b4e828e612174565b90508e811115611b8c578c8f611b6491906122cd565b9150611b72601a600a612204565b611b7c86846122ae565b611b8691906121ad565b92508e90505b9b508b611b99838f6122cd565b9d50818660c001516001600160601b0316611bb491906122cd565b6001600160601b0390811660c088015260e08701516116e291859116612174565b6000611fff601383901c166207ffff831682611bf26064846122ff565b61ffff16905060006301ffffff611c0a600a84612320565b611c159060196122ae565b7f0220f5210e98bb865d1dc2b7c26120e3f07327782b08640e4b66038fad000000901c166301ffffff611c49600a856121ad565b611c549060196122ae565b611c8392917f03bb6d01bdb8cecfefc66101802d413cd51cb459d9624498446224bf7f00000090911c166122ae565b905063023f1490611c948482612174565b611c9e90836122ae565b611ca891906121ad565b9450505050915091565b604051806103e00160405280601f906020820280368337509192915050565b6040805161010081018252600080825260208201819052918101829052606081018290526080810182905260a0810182905260c0810182905260e081019190915290565b6040518060a001604052806005906020820280368337509192915050565b803561ffff81168114611d4557600080fd5b919050565b803563ffffffff81168114611d4557600080fd5b80356001600160401b0381168114611d4557600080fd5b80356001600160601b0381168114611d4557600080fd5b600060208284031215611d9e57600080fd5b8151611da9816123a2565b9392505050565b600080600060608486031215611dc557600080fd5b8335611dd0816123a2565b95602085013595506040909401359392505050565b600060208284031215611df757600080fd5b81518015158114611da957600080fd5b600080828403610120811215611e1c57600080fd5b61010080821215611e2c57600080fd5b60405191508082018281106001600160401b0382111715611e5d57634e487b7160e01b600052604160045260246000fd5b604052611e6985611d5e565b8252611e7760208601611d5e565b6020830152611e8860408601611d33565b6040830152611e9960608601611d33565b6060830152611eaa60808601611d4a565b6080830152611ebb60a08601611d4a565b60a0830152611ecc60c08601611d75565b60c0830152611edd60e08601611d75565b60e0830152909593013593505050565b600060208284031215611eff57600080fd5b5035919050565b600060208284031215611f1857600080fd5b5051919050565b60008060008060608587031215611f3557600080fd5b8435935060208501356001600160401b0380821115611f5357600080fd5b818701915087601f830112611f6757600080fd5b813581811115611f7657600080fd5b8860208260051b8501011115611f8b57600080fd5b95986020929092019750949560400135945092505050565b600080600060608486031215611fb857600080fd5b505081359360208301359350604090920135919050565b6000825160005b81811015611ff05760208186018101518583015201611fd6565b81811115611fff576000828501525b509190910192915050565b602080825282518282018190526000919084820190604085019084805b8281101561206757845184835b600581101561205157825182529188019190880190600101612034565b5050509385019360a09390930192600101612027565b5091979650505050505050565b6103e08101818360005b601f81101561209d57815183526020928301929091019060010161207e565b50505092915050565b60a08101818360005b600581101561209d5781518352602092830192909101906001016120af565b6000610100820190506001600160401b0380845116835280602085015116602084015250604083015161ffff8082166040850152806060860151166060850152505063ffffffff608084015116608083015260a083015161213760a084018263ffffffff169052565b5060c083015161215260c08401826001600160601b03169052565b5060e083015161216d60e08401826001600160601b03169052565b5092915050565b6000821982111561218757612187612334565b500190565b600061ffff808416806121a1576121a161234a565b92169190910492915050565b6000826121bc576121bc61234a565b500490565b600181815b808511156121fc5781600019048211156121e2576121e2612334565b808516156121ef57918102915b93841c93908002906121c6565b509250929050565b6000611da9838360008261221a575060016122a8565b81612227575060006122a8565b816001811461223d576002811461224757612263565b60019150506122a8565b60ff84111561225857612258612334565b50506001821b6122a8565b5060208310610133831016604e8410600b8410161715612286575081810a6122a8565b61229083836121c1565b80600019048211156122a4576122a4612334565b0290505b92915050565b60008160001904831182151516156122c8576122c8612334565b500290565b6000828210156122df576122df612334565b500390565b60006000198214156122f8576122f8612334565b5060010190565b600061ffff808416806123145761231461234a565b92169190910692915050565b60008261232f5761232f61234a565b500690565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052601260045260246000fd5b634e487b7160e01b600052603160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160a01b03811681146123b757600080fd5b5056fea26469706673582212204821b23f00b8c16afd732eda5acfec4b3c6476af9a53d41c3da78127d7f7f96b64736f6c63430008060033"

window.proxyBytecode = "0x60a060405234801561001057600080fd5b5060405161027c38038061027c83398101604081905261002f91610090565b600080546001600160a01b039485166001600160a01b0319918216179091556001805493851693821693909317909255600280549092163317909155166080526100d3565b80516001600160a01b038116811461008b57600080fd5b919050565b6000806000606084860312156100a557600080fd5b6100ae84610074565b92506100bc60208501610074565b91506100ca60408501610074565b90509250925092565b6080516101896100f3600039600081816052015260e301526101896000f3fe6080604052600436106100435760003560e01c80634ddd108a1461009457806390a1707b146100d1578063bdf3c4ae14610113578063c45a0155146101335761004d565b3661004d57600080fd5b6040517f00000000000000000000000000000000000000000000000000000000000000009036600082376000803683855af43d806000843e818015610090578184f35b8184fd5b3480156100a057600080fd5b506001546100b4906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b3480156100dd57600080fd5b506101057f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020016100c8565b34801561011f57600080fd5b506000546100b4906001600160a01b031681565b34801561013f57600080fd5b506002546100b4906001600160a01b03168156fea264697066735822122090678c1f270d7619b123f627d306b9040aa83dbc7573e2eb7024d3e2a568c17964736f6c63430008060033"

window.factoryBytecode = "0x608060405234801561001057600080fd5b5060405161070338038061070383398101604081905261002f9161006f565b60008054336001600160a01b03199182168117909255600180548216909217909155600280549091166001600160a01b039290921691909117905561009f565b60006020828403121561008157600080fd5b81516001600160a01b038116811461009857600080fd5b9392505050565b610655806100ae6000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c8063405a0a041161005b578063405a0a04146100ce5780639c041ebd146100e1578063eeb97a09146100f4578063f46901ed1461010757600080fd5b8063017e7e5814610082578063094b7415146100b15780632dd072a0146100c4575b600080fd5b600254610095906001600160a01b031681565b6040516001600160a01b03909116815260200160405180910390f35b600054610095906001600160a01b031681565b6100cc61011a565b005b6100cc6100dc36600461033e565b610194565b6100cc6100ef366004610360565b610203565b600154610095906001600160a01b031681565b6100cc61011536600461033e565b6102a6565b6001546001600160a01b031633146101705760405162461bcd60e51b81526020600482015260146024820152733737ba16b732bb96b332b2ba3796b9b2ba3a32b960611b60448201526064015b60405180910390fd5b600154600080546001600160a01b0319166001600160a01b03909216919091179055565b6000546001600160a01b031633146101e15760405162461bcd60e51b815260206004820152601060248201526f3737ba16b332b2ba3796b9b2ba3a32b960811b6044820152606401610167565b600180546001600160a01b0319166001600160a01b0392909216919091179055565b60008060001b84848460405161021890610315565b6001600160a01b039384168152918316602083015290911660408201526060018190604051809103906000f5905080158015610258573d6000803e3d6000fd5b506040516001600160a01b038083168252919250818516918616907f454b0172f64812df0cd504c2bd7df7aab8ff328a54d946b4bd0fa7c527adf9cc9060200160405180910390a350505050565b6000546001600160a01b031633146102f35760405162461bcd60e51b815260206004820152601060248201526f3737ba16b332b2ba3796b9b2ba3a32b960811b6044820152606401610167565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b61027c806103a483390190565b80356001600160a01b038116811461033957600080fd5b919050565b60006020828403121561035057600080fd5b61035982610322565b9392505050565b60008060006060848603121561037557600080fd5b61037e84610322565b925061038c60208501610322565b915061039a60408501610322565b9050925092509256fe60a060405234801561001057600080fd5b5060405161027c38038061027c83398101604081905261002f91610090565b600080546001600160a01b039485166001600160a01b0319918216179091556001805493851693821693909317909255600280549092163317909155166080526100d3565b80516001600160a01b038116811461008b57600080fd5b919050565b6000806000606084860312156100a557600080fd5b6100ae84610074565b92506100bc60208501610074565b91506100ca60408501610074565b90509250925092565b6080516101896100f3600039600081816052015260e301526101896000f3fe6080604052600436106100435760003560e01c80634ddd108a1461009457806390a1707b146100d1578063bdf3c4ae14610113578063c45a0155146101335761004d565b3661004d57600080fd5b6040517f00000000000000000000000000000000000000000000000000000000000000009036600082376000803683855af43d806000843e818015610090578184f35b8184fd5b3480156100a057600080fd5b506001546100b4906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b3480156100dd57600080fd5b506101057f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020016100c8565b34801561011f57600080fd5b506000546100b4906001600160a01b031681565b34801561013f57600080fd5b506002546100b4906001600160a01b03168156fea264697066735822122090678c1f270d7619b123f627d306b9040aa83dbc7573e2eb7024d3e2a568c17964736f6c63430008060033a264697066735822122021b6c8c06af316946f319ae696fbdb227e2a2652b34ebe05d2b15d50b6e18cca64736f6c63430008060033"

window.LogicAddress = "0x09671aD90454bB72F0ceEa987B8EFa3284089dd9"

window.FactoryAddress = "0xBC6a7211442139e333B5D9efAE1005f642819811"

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

window.ABI = [
"function createGridOrder(uint packedOrder) external payable",
//uint packedPriceLo = uint32(packedOrder >> 0);
//uint packedPriceHi = uint32(packedOrder >> 32);
//order.stockAmount = uint96(packedOrder >> 64);
//order.moneyAmount = uint96(packedOrder >> (64+96));
"function cancelGridOrder(uint userIdx) external",
"function dealWithSellOrders(uint maxPrice, uint[] orderPosList, uint moneyAmountIn_maxGotStock) external",
"function dealWithBuyOrders(uint minPrice, uint[] orderPosList, uint stockAmountIn_maxGotMoney) external",
"function getUserOrders(address user, uint start, uint end) view external returns(uint[5][] memory orders)",
"function getSellOrders(uint tick, uint start, uint end) view external returns(uint[5][] memory orders)",
"function getBuyOrders(uint tick, uint start, uint end) view external returns(uint[5][] memory orders)",
"function getSellOrderMaskWords() view returns(uint[31])",
"function getBuyOrderMaskWords() view returns(uint[31])"]

window.DealWithSellOrders = ethers.utils.id("DealWithSellOrders(address,uint256)")
window.DealWithBuyOrders = ethers.utils.id("DealWithBuyOrders(address,uint256)")

window.alertNoWallet = function() {
      alert("No wallet installed! Please install MetaMask or other web3 wallet to use this App.");
}

window.alertNoCurrentMarket = function() {
      alert("You have not chosen the current market! Please choose one in the 'Markets' tab.");
}

window.getMarketAddress = function(stockAddr, moneyAddr) {
  const stock32 = ethers.utils.hexZeroPad(stockAddr, 32).substr(2) // using substr to skip 0x
  const money32 = ethers.utils.hexZeroPad(moneyAddr, 32).substr(2)
  const impl32 = ethers.utils.hexZeroPad(LogicAddress, 32).substr(2)
  const deployCode = window.proxyBytecode+stock32+money32+impl32
  const deployCodeHash = ethers.utils.keccak256(deployCode)
  return ethers.utils.getCreate2Address(window.FactoryAddress, ethers.utils.hexZeroPad("0x0", 32), deployCodeHash)
}

window.orderArrayToObj = function(orderArr, indexAndTick, stockDecimals, moneyDecimals) {
  return {
    indexAndTick: indexAndTick,
    id: orderArr[0].toHexString(),
    lowPrice: parseFloat(ethers.utils.formatUnits(orderArr[1], 26)).toPrecision(6)*1.0,
    highPrice: parseFloat(ethers.utils.formatUnits(orderArr[2], 26)).toPrecision(6)*1.0,
    stockAmount: parseFloat(ethers.utils.formatUnits(orderArr[3], stockDecimals)).toPrecision(6)*1.0,
    moneyAmount: parseFloat(ethers.utils.formatUnits(orderArr[4], moneyDecimals)).toPrecision(6)*1.0,
  }
}

window.safeGetAmount = async function(coinType, symbol, amount, decimals, marketAddress, gasPrice) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const sep20Contract = new ethers.Contract(coinType, SEP20ABI, provider)
  const addr = await signer.getAddress()
  const balanceAmt = await sep20Contract.balanceOf(addr)
  const balance = ethers.utils.formatUnits(balanceAmt, decimals)
  const allowanceAmt = await sep20Contract.allowance(addr, marketAddress)
  const allowance = ethers.utils.formatUnits(allowanceAmt, decimals)
  console.log("allowance", symbol, allowance)
  if(amount*Math.pow(10, decimals) >= Math.pow(2, 95)) {
    alert("The amount is larger than 2**95. This DApp cannot support it.")
    return null
  }
  if(balance < amount) {
    alert("You do not own enough "+symbol+" for the grid order! It needs "+amount+" and you only have "+balance)
    return null
  }
  if(coinType != SEP206Address && allowance < amount) {
    const ok = confirm("You haven't approve enough "+symbol+" to this DApp. Do you want to approve now?")
    if(ok) {
      const maxAmount = "0x0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
      alert("Transaction for approving will be sent. Please retry after it succeeds.")
      sep20Contract.connect(signer).approve(marketAddress, maxAmount/*, {gasPrice: gasPrice}*/)
    }
    return null
  }
  return ethers.utils.parseUnits(amount.toString(), decimals)
}


if (typeof window.ethereum === 'undefined') {
  alertNoWallet()
} else {
  ethereum.request({ method: 'eth_requestAccounts' })
}

google.charts.load('current', {packages: ['corechart', 'line']});

createApp(App).use(router).mount('#app')

// Account1: 0x5637c9fbFf9FAf5f534d0a88199feCD97357635B
// Account2: 0xd6c5F62c58238bfF1210b53ED5d1b2224EBC5176
// Account3: 0x732B170AB666146ea3752c81b27E85d215EEb190
// MOON: 0x822C524218aBaD5FE9555f4E7F7E05DDa290915e
// MARS: 0xAD0985a0A49C7C73961FF39ED90e6590aD4D0B10
// XYZ: 0xf9fe089830856aB0d2AAf4a0cD4E6587Ee4de852

