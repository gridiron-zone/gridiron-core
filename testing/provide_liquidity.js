import dotenv from "dotenv";
dotenv.config();
import {
    mintInitMessage,
    MintingContractPath,
    PairContractPath,
    walletTest1,
    walletTest2,
    walletTest3,
    mint_wallet,
    treasury_wallet,
    bonding_wallet,
    liquidity_wallet,
    marketing_wallet,
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
    writeArtifact,
    queryBank
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
const question = promisify(rl.question).bind(rl);

const main = async () => {
    try {
        console.log(`Wallet to be used treasury_wallet ${treasury_wallet.key.accAddress}`);
        const uusdInput = await question('How much uusd tokens you wish to xrf to LP ? ');
        let deploymentDetails = readArtifact(terraClient.chainID);
        let uusd_amount = Number(uusdInput);
        let resp = await queryBank(treasury_wallet.key.accAddress);
        console.log(`${JSON.stringify(resp[1].total)}  ${JSON.stringify(resp[0])}`);
        await provideLiquidityAuthorised(deploymentDetails,uusd_amount,treasury_wallet,false);
    } catch (error) {
        console.log(error);
    }
    rl.close()
}
const provideLiquidityAuthorised = async (deploymentDetails, uusd_amount, wallet, checkOnly) => {
    let proxyQuery = await queryContract(deploymentDetails.proxyContractAddress, {
                configuration: {}
            });
    if (wallet.key.accAddress != proxyQuery.authorized_liquidity_provider) {
        console.log(`Authorized liquidity wallet in proxy is different: ${proxyQuery.authorized_liquidity_provider}`);
        return;
    }
    let poolQuery = await queryContract(deploymentDetails.proxyContractAddress, {
                pool: {}
            });
    let fury_amount = Math.trunc(uusd_amount*Number(poolQuery.assets[0].amount)/Number(poolQuery.assets[1].amount));
    console.log(`Price of 1 Fury = ${Number(poolQuery.assets[1].amount)/Number(poolQuery.assets[0].amount)} UST`);
    let furyBalanceQuery = await queryContract(deploymentDetails.furyContractAddress, {
                                                balance: { address : wallet.key.accAddress}
                                                });
    if (Number(furyBalanceQuery.balance) < fury_amount || checkOnly)     {
        console.log(`Fury Balance of ${wallet.key.accAddress} : ${furyBalanceQuery.balance}`);
        console.log(`Fury Required ${fury_amount}`);
        return;
    }
    console.log(`Fury Required ${fury_amount}`);
    // First increase allowance for proxy to spend from mint_wallet wallet
    let increaseAllowanceMsg = {
        increase_allowance: {
            spender: deploymentDetails.proxyContractAddress,
            amount: fury_amount.toString()
        }
    };
    let incrAllowResp = await executeContract(wallet, deploymentDetails.furyContractAddress, increaseAllowanceMsg);
    console.log(`Increase allowance response hash = ${incrAllowResp['txhash']}`);
    let executeMsg = {
        provide_liquidity: {
            to: wallet.key.accAddress,
            assets: [
                {
                    info: {
                        native_token: {
                            denom: "uusd"
                        }
                    },
                    amount: uusd_amount.toString()
                },
                {
                    info: {
                        token: {
                            contract_addr: deploymentDetails.furyContractAddress
                        }
                    },
                    amount: fury_amount.toString()
                }
            ]
        }
    };
    let tax = await terraClient.utils.calculateTax(new Coin("uusd", uusd_amount.toString()));
    console.log(`tax = ${tax}`);
    let funds = Number(uusd_amount);
    funds = funds + Number(tax.amount);
    console.log(`funds = ${funds}`);
    let response = await executeContract(wallet, deploymentDetails.proxyContractAddress, executeMsg, { 'uusd': funds });
    console.log(`Provide Liquidity (from ${wallet.key.accAddress}) Response - ${response['txhash']}`);

}


const increasePOLRewardAllowance = async (deploymentDetails,wallet,checkOnly) => {
    let response = await queryContract(deploymentDetails.furyContractAddress, {
        balance: {address: wallet.key.accAddress}
    });
    let respBalance = Number(response.balance);
    response = await queryContract(deploymentDetails.furyContractAddress, {
        allowance: {owner: wallet.key.accAddress,
                    spender:deploymentDetails.proxyContractAddress}
    });
    let respAllowance = Number(response.allowance);
    console.log(`native : existing balance ${respBalance}, existing allowance ${respAllowance}, increase allowance by ${respBalance - respAllowance}`);
    if (respBalance > respAllowance && !checkOnly) {
        let increase_amount = respBalance - respAllowance;
        let execMsg = {increase_allowance: { spender : deploymentDetails.proxyContractAddress, amount: increase_amount.toString()}};
        let execResponse = await executeContract (wallet, deploymentDetails.furyContractAddress, execMsg);
        console.log(`POL increase allowance by ${increase_amount} uFury for proxy in wallet ${wallet.key.accAddress}, txhash ${execResponse['txhash']}`);
    }
}
main()
