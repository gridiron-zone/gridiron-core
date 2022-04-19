import dotenv from "dotenv";
dotenv.config();
import {
    mintInitMessage,
    MintingContractPath,
    VnDContractPath,
    PairContractPath,
    walletTest1,
    walletTest2,
    walletTest3,
    mint_wallet,
    treasury_wallet,
    liquidity_wallet,
    marketing_wallet,
    bonded_lp_reward_wallet,
    terraTestnetClient,
    localTerraClient,
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
import { Coin } from '@terra-money/terra.js';
const assert = chai.assert;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// const question = promisify(rl.question).bind(rl);
function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    })
}

let configResponseReceived;

const main = async () => {
    const sleep_time = (process.env.TERRA_CLIENT === "localTerra") ? 31 : 15000;
    try {
        let deploymentDetails = readArtifact(terraClient.chainID);
        await VnDPeriodic(deploymentDetails);
        await new Promise(resolve => setTimeout(resolve, sleep_time));

        await claimVestedFury(deploymentDetails,marketing_wallet);
    } catch (error) {
        console.log(error);
    } finally {
        rl.close();
    }
}

async function VnDPeriodic(deploymentDetails) {
    let VnDTransfer = { periodically_calculate_vesting: {}};
    let response = await executeContract(mint_wallet, deploymentDetails.VnDContractAddress, VnDTransfer);
    console.log(`periodically_calculate_vesting Response - ${response['txhash']}`);
    let VnDVest = { periodically_transfer_to_categories: {}};
    response = await executeContract(mint_wallet, deploymentDetails.VnDContractAddress, VnDVest);
    console.log(`periodically_transfer_to_categories Response - ${response['txhash']}`);
    await increasePOLRewardAllowance(deploymentDetails,bonded_lp_reward_wallet);
    await increasePOLRewardAllowance(deploymentDetails,liquidity_wallet);
}

const claimVestedFury = async (deploymentDetails,wallet) => {
    let response = await queryContract(deploymentDetails.VnDContractAddress, {
        vesting_details: {address: wallet.key.accAddress}
    });
    let respBalance = Number(response.tokens_available_to_claim);
    let execMsg = {claim_vested_tokens: { amount : respBalance.toString()}};
    let execResponse = await executeContract (wallet, deploymentDetails.VnDContractAddress, execMsg);
    console.log(`Claim all Vested Tokens ${respBalance} uFury for wallet ${wallet.key.accAddress}, txhash ${execResponse['txhash']}`);
}

const increasePOLRewardAllowance = async (deploymentDetails,wallet) => {
    let response = await queryContract(deploymentDetails.furyContractAddress, {
        balance: {address: wallet.key.accAddress}
    });
    let respBalance = Number(response.balance);
    response = await queryContract(deploymentDetails.furyContractAddress, {
        allowance: {owner: wallet.key.accAddress,
                    spender: deploymentDetails.proxyContractAddress}
    });
    let respAllowance = Number(response.allowance);
    console.log(`fury : existing balance ${respBalance}, existing allowance ${respAllowance}, increase allowance by ${respBalance - respAllowance}`);
    if (respBalance > respAllowance) {
        let increase_amount = respBalance - respAllowance;
        let execMsg = {increase_allowance: { spender : deploymentDetails.proxyContractAddress, amount: increase_amount.toString()}};
        let execResponse = await executeContract (wallet, deploymentDetails.furyContractAddress, execMsg);
        console.log(`POL increase allowance by ${increase_amount} uFury for proxy in wallet ${wallet.key.accAddress}, txhash ${execResponse['txhash']}`);
    }
}


main()
