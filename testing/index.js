import {
    mintInitMessage,
    MintingContractPath,
    PairContractPath,
    walletTest1,
    walletTest2,
    walletTest3,
    mint_wallet,
    terraClient,
    StakingContractPath,
    FactoryContractPath,
    ProxyContractPath
} from './constants.js';
import {
    storeCode,
    queryContract,
    executeContract,
    instantiateContract,
    sendTransaction,
    readArtifact,
    writeArtifact
} from "./utils.js";

import { primeAccountsWithFunds } from "./primeCustomAccounts.js";

import { promisify } from 'util';

import * as readline from 'node:readline';

import * as chai from 'chai';
const assert = chai.assert;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const question = promisify(rl.question).bind(rl);


const main = async () => {
    try {
        let deploymentDetails = readArtifact(terraClient.chainID);
        const primeAccounts = await question('Do you want to preload custom accounts? (Y/N) ');
        if (primeAccounts === 'Y' || primeAccounts === 'y') {
            primeAccountsWithFunds();
        }
        const startFresh = await question('Do you want to upload and deploy fresh? (Y/N)');
        if (startFresh === 'Y' || startFresh === 'y') {
            deploymentDetails = {};
        }
        if (!deploymentDetails.adminWallet) {
            deploymentDetails.adminWallet = mint_wallet.key.accAddress;
        }
        uploadFuryTokenContract(deploymentDetails).then(() => {
            instantiateFuryTokenContract(deploymentDetails).then(() => {
                uploadPairContract(deploymentDetails).then(() => {
                    uploadStakingContract(deploymentDetails).then(() => {
                        instantiateStaking(deploymentDetails).then(() => {
                            uploadWhiteListContract(deploymentDetails).then(() => {
                                uploadFactoryContract(deploymentDetails).then(() => {
                                    instantiateFactory(deploymentDetails).then(() => {
                                        uploadProxyContract(deploymentDetails).then(() => {
                                            instantiateProxyContract(deploymentDetails).then(() => {
                                                createPoolPairs(deploymentDetails).then(() => {
                                                    savePairAddressToProxy(deploymentDetails).then(() => {
                                                        console.log("deploymentDetails = " + JSON.stringify(deploymentDetails, null, ' '));
                                                        rl.close();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        await checkLPTokenDetails(deploymentDetails);
        await provideLiquidity(deploymentDetails);
        console.log("Finished");
    } catch (error) {
        console.log(error);
    }
}

const uploadFuryTokenContract = async (deploymentDetails) => {
    if (!deploymentDetails.furyTokenCodeId) {
        let deployFury = false;
        const answer = await question('Do you want to upload Fury Token Contract? (Y/N) ');
        if (answer === 'Y') {
            deployFury = true;
        } else if (answer === 'N') {
            const codeId = await question('Please provide code id for Fury Token contract: ');
            if (isNaN(codeId)) {
                deployFury = true;
            } else {
                deploymentDetails.furyTokenCodeId = codeId;
                deployFury = false;
            }
        } else {
            console.log("Alright! Have fun!! :-)");
        }
        if (deployFury) {
            console.log("Uploading Fury token contract");
            console.log(`mint_wallet = ${mint_wallet.key}`);
            let contractId = await storeCode(mint_wallet, MintingContractPath); // Getting the contract id from local terra
            console.log(`Fury Token Contract ID: ${contractId}`);
            deploymentDetails.furyTokenCodeId = contractId;
            writeArtifact(deploymentDetails, terraClient.chainID);
        }
    }
}

const instantiateFuryTokenContract = async (deploymentDetails) => {
    if (!deploymentDetails.furyContractAddress) {
        let instantiateFury = false;
        const answer = await question('Do you want to instantiate Fury Token Contract? (Y/N) ');
        if (answer === 'Y') {
            instantiateFury = true;
        } else if (answer === 'N') {
            const contractAddress = await question('Please provide contract address for Fury Token contract: ');
            deploymentDetails.furyContractAddress = contractAddress;
            instantiateFury = false;
        }
        if (instantiateFury) {
            console.log("Instantiating Fury token contract");
            let initiate = await instantiateContract(mint_wallet, deploymentDetails.furyTokenCodeId, mintInitMessage)
            // The order is very imp
            let contractAddress = initiate.logs[0].events[0].attributes[3].value;
            console.log(`Fury Token Contract ID: ${contractAddress}`)
            deploymentDetails.furyContractAddress = contractAddress;
            writeArtifact(deploymentDetails, terraClient.chainID);
        }
    }
}


const uploadPairContract = async (deploymentDetails) => {
    if (!deploymentDetails.pairCodeId) {
        console.log("Uploading pair contract (xyk)");
        let contractId = await storeCode(mint_wallet, PairContractPath); // Getting the contract id from local terra
        console.log(`Pair Contract ID: ${contractId}`);
        deploymentDetails.pairCodeId = contractId;
        writeArtifact(deploymentDetails, terraClient.chainID);
    }
}

const uploadStakingContract = async (deploymentDetails) => {
    if (!deploymentDetails.stakingCodeId) {
        console.log("Uploading staking contract");
        let contractId = await storeCode(mint_wallet, StakingContractPath); // Getting the contract id from local terra
        console.log(`Staking Contract ID: ${contractId}`);
        deploymentDetails.stakingCodeId = contractId;
        writeArtifact(deploymentDetails, terraClient.chainID);
    }
}

const instantiateStaking = async (deploymentDetails) => {
    if (!deploymentDetails.stakingAddress || !deploymentDetails.xastroAddress) {
        console.log("Instantiating staking contract");
        let stakingInitMessage = {
            owner: deploymentDetails.adminWallet,
            token_code_id: deploymentDetails.furyTokenCodeId,
            deposit_token_addr: deploymentDetails.furyContractAddress
        }

        let result = await instantiateContract(mint_wallet, deploymentDetails.stakingCodeId, stakingInitMessage)
        // The order is very imp
        let contractAddress = result.logs[0].events[0].attributes.filter(element => element.key == 'contract_address').map(x => x.value);
        deploymentDetails.stakingAddress = contractAddress.shift()
        deploymentDetails.xastroAddress = contractAddress.shift();
        writeArtifact(deploymentDetails, terraClient.chainID);
    }
}

const uploadWhiteListContract = async (deploymentDetails) => {
    if (!deploymentDetails.whitelistCodeId) {
        console.log("Uploading whitelist contract");
        let contractId = await storeCode(mint_wallet, StakingContractPath); // Getting the contract id from local terra
        console.log(`Whitelist Contract ID: ${contractId}`);
        deploymentDetails.whitelistCodeId = contractId;
        writeArtifact(deploymentDetails, terraClient.chainID);
    }
}

const uploadFactoryContract = async (deploymentDetails) => {
    if (!deploymentDetails.factoryCodeId) {
        console.log("Uploading factory contract");
        let contractId = await storeCode(mint_wallet, FactoryContractPath); // Getting the contract id from local terra
        console.log(`Factory Contract ID: ${contractId}`);
        deploymentDetails.factoryCodeId = contractId;
        writeArtifact(deploymentDetails, terraClient.chainID);
    }
}

const instantiateFactory = async (deploymentDetails) => {
    if (!deploymentDetails.factoryAddress) {
        console.log("Instantiating factory contract");
        let factoryInitMessage = {
            owner: deploymentDetails.adminWallet,
            pair_configs: [
                {
                    code_id: deploymentDetails.pairCodeId,
                    pair_type: { "xyk": {} },
                    total_fee_bps: 0,
                    maker_fee_bps: 0
                }
            ],
            token_code_id: deploymentDetails.furyTokenCodeId,
            whitelist_code_id: deploymentDetails.whitelistCodeId
        }
        console.log(JSON.stringify(factoryInitMessage, null, 2));
        let result = await instantiateContract(mint_wallet, deploymentDetails.factoryCodeId, factoryInitMessage);
        let contractAddresses = result.logs[0].events[0].attributes.filter(element => element.key == 'contract_address').map(x => x.value);
        deploymentDetails.factoryAddress = contractAddresses.shift();
        writeArtifact(deploymentDetails, terraClient.chainID);
    }
}

const uploadProxyContract = async (deploymentDetails) => {
    if (!deploymentDetails.proxyCodeId) {
        console.log("Uploading proxy contract");
        let contractId = await storeCode(mint_wallet, ProxyContractPath); // Getting the contract id from local terra
        console.log(`Proxy Contract ID: ${contractId}`);
        deploymentDetails.proxyCodeId = contractId;
        writeArtifact(deploymentDetails, terraClient.chainID);
    }
}

const instantiateProxyContract = async (deploymentDetails) => {
    if (!deploymentDetails.proxyContractAddress) {
        console.log("Instantiating proxy contract");
        let proxyInitMessage = {
            /// Pool pair contract address of astroport
            pool_pair_address: deploymentDetails.poolPairContractAddress,
            /// contract address of Fury token
            custom_token_address: deploymentDetails.furyContractAddress,
            authorized_liquidity_provider: deploymentDetails.adminWallet,
            swap_opening_date: "1644734115627110528",
        }
        console.log(JSON.stringify(proxyInitMessage, null, 2));
        let result = await instantiateContract(mint_wallet, deploymentDetails.proxyCodeId, proxyInitMessage);
        let contractAddresses = result.logs[0].events[0].attributes.filter(element => element.key == 'contract_address').map(x => x.value);
        deploymentDetails.proxyContractAddress = contractAddresses.shift();
        writeArtifact(deploymentDetails, terraClient.chainID);
    }
}

const createPoolPairs = async (deploymentDetails) => {
    if (!deploymentDetails.poolPairContractAddress) {
        let init_param = { proxy: deploymentDetails.proxyContractAddress };
        console.log(`init_param = ${JSON.stringify(init_param)}`);
        console.log(Buffer.from(JSON.stringify(init_param)).toString('base64'));
        let executeMsg = {
            create_pair: {
                pair_type: { xyk: {} },
                asset_infos: [
                    {
                        token: {
                            contract_addr: deploymentDetails.furyContractAddress
                        }
                    },
                    {
                        native_token: { denom: "uusd" }
                    }
                ],
                init_params: Buffer.from(JSON.stringify(init_param)).toString('base64')
            }
        };
        console.log(`executeMsg = ${executeMsg}`);
        let response = await executeContract(mint_wallet, deploymentDetails.factoryAddress, executeMsg);

        deploymentDetails.poolPairContractAddress = response.logs[0].eventsByType.from_contract.pair_contract_addr[0]

        let pool_info = await queryContract(deploymentDetails.poolPairContractAddress, {
            pair: {}
        })

        deploymentDetails.poolLpTokenAddress = pool_info.liquidity_token

        console.log(`Pair successfully created! Address: ${deploymentDetails.poolPairContractAddress}`)
        writeArtifact(deploymentDetails, terraClient.chainID)
    }
}

const savePairAddressToProxy = async (deploymentDetails) => {
    if (!deploymentDetails.poolpairSavedToProxy) {
        //Fetch configuration
        let configResponse = await queryContract(deploymentDetails.proxyContractAddress, {
            configuration: {}
        });
        configResponse.pool_pair_address = deploymentDetails.poolPairContractAddress;
        console.log(`Configuration = ${JSON.stringify(configResponse)}`);
        let executeMsg = {
            configure: configResponse
        };
        console.log(`executeMsg = ${executeMsg}`);
        let response = await executeContract(mint_wallet, deploymentDetails.proxyContractAddress, executeMsg);
        console.log(`Save Response - ${response['txhash']}`);
        deploymentDetails.poolpairSavedToProxy = true;
        writeArtifact(deploymentDetails, terraClient.chainID)
    }
}

const checkLPTokenDetails = async (deploymentDetails) => {
    let lpTokenDetails = await queryContract(deploymentDetails.poolLpTokenAddress, {
        token_info: {}
    });
    console.log(JSON.stringify(lpTokenDetails));
    assert.equal(lpTokenDetails['name'],"FURY-UUSD-LP");
}

const provideLiquidity = async (deploymentDetails) => {
    //First increase allowance for proxy to spend from mint_wallet wallet
    let increaseAllowanceMsg = {
        increase_allowance: {
            spender: deploymentDetails.proxyContractAddress,
            amount: "5000000000"
        }
    };
    let incrAllowResp = await executeContract(mint_wallet, deploymentDetails.furyContractAddress, increaseAllowanceMsg);
    console.log(`Increase allowance response hash = ${incrAllowResp['txhash']}`);
    let executeMsg = {
        provide_liquidity:{
            assets:[
                {
                    info:{
                        native_token:{
                            denom:"uusd"
                        }
                    },
                    amount:"500000000"
                },
                {
                    info:{
                        token:{
                            contract_addr:deploymentDetails.furyContractAddress
                        }
                    },
                    amount:"5000000000"
                }
            ]
        }
    };
    let response = await executeContract(mint_wallet, deploymentDetails.proxyContractAddress, executeMsg, {'uusd': 500000000});
    console.log(`Save Response - ${response['txhash']}`);
}

main()