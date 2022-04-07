import dotenv from "dotenv";
dotenv.config();
import {
    terraTestnetClient,
    localTerraClient,
    terraClient,
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

const main = async () => {
    let all_accounts = [];
    let total_count = 0
            
    try {

        // let tokenAccounts = readArtifact('t');
        // let deploymentDetails = readArtifact(terraClient.chainID);

        let contractAddress = await question('Enter Token Contract Address? ');

        let tokenInfo = await terraClient.wasm.contractInfo(contractAddress);
        let tokenName = tokenInfo.init_msg.name
        await console.log(`Token Name : ${tokenName}`)
        let limit = 30
        let response
        let balance
        let resp_count = 30
        let prv_last
        while (resp_count == 30) {
            if (total_count == 0) {
                response = await queryContract(contractAddress, {all_accounts:{limit:limit}})
            } else {
                response = await queryContract(contractAddress, {all_accounts:{start_after:prv_last, limit:limit}})
            }
            // await console.log(`Response : ${JSON.stringify(response)}`)
            let idx = 0
            while (idx < response.accounts.length) {
                let acnt_address = response.accounts[idx].toString()
                balance = await queryContract(contractAddress, {balance:{address:acnt_address}})
                all_accounts.push( "("+acnt_address +":"+balance.balance.toString()+")")
                idx += 1
            }
            prv_last = response.accounts[idx-1]
            resp_count = response.accounts.length
            total_count += resp_count
        }
    } catch (error) {
        await console.log(error);
    } finally {
        //await console.log(all_accounts.length())
        await console.log(`All (${total_count}) : ${all_accounts}`)
        rl.close();
    }
}

main()