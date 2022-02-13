import {
    mintInitMessage,
    MintingContractPath,
    PairContractPath,
    walletTest2,
    walletTest3,
    mint_wallet,
    terraClient,
    StakingContractPath,
    FactoryContractPath,
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

import { promisify } from 'util';

import * as readline from 'node:readline';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const question = promisify(rl.question).bind(rl);


const main = async () => {
    try {
        let deploymentDetails = readArtifact(terraClient.chainID);
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
                                        createPoolPairs(deploymentDetails).then(() => {
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
        console.log("Uploading staking contract (xyk)");
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
        console.log("Uploading factory contract (xyk)");
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

const createPoolPairs = async (deploymentDetails) => {
    if (!deploymentDetails.poolpairContractAddress) {
        response = await executeContract(mint_wallet, deploymentDetails.factoryAddress, {
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
                ]
            }
        });
        console.log(`Transfer Response - ${response['txhash']}`) //  Use the Hash to query the tx on : https://finder.terra.money/localterra/
    }
}

main()