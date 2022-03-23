import {
    walletTest1,
    walletTest2,
    walletTest3,
    walletTest4,
    walletTest5,
    walletTest6,
    walletTest7,
    mint_wallet,
    treasury_wallet,
    liquidity_wallet,
    marketing_wallet,
    bonded_lp_reward_wallet,
    nitin_wallet,
    ajay_wallet,
    sameer_wallet,
    terraClient,
} from './constants.js';

import { MsgSend } from '@terra-money/terra.js';

export async function primeAccountsWithFunds() {
    var txHash = [];
    txHash.push(await bankTransferFunde(walletTest1,mint_wallet,500000000,1000000000));
    txHash.push(await bankTransferFunde(walletTest2,treasury_wallet,500000000,10000000000));
    txHash.push(await bankTransferFunde(walletTest3,liquidity_wallet,500000000,10000000000));
    txHash.push(await bankTransferFunde(walletTest4,marketing_wallet,500000000,10000000000));
    txHash.push(await bankTransferFunde(walletTest5,nitin_wallet,500000000,10000000000));
    txHash.push(await bankTransferFunde(walletTest6,ajay_wallet,500000000,10000000000));
    txHash.push(await bankTransferFunde(walletTest7,sameer_wallet,500000000,10000000000));
    txHash.push(await bankTransferFunde(walletTest5,bonded_lp_reward_wallet,500000000,10000000000));
    console.log("leaving primeCustomAccounts");
    return txHash;
}

function bankTransferFunde(wallet_from, wallet_to, uluna_amount, uusd_amount) {
    console.log(`Funding ${wallet_to.key.accAddress}`);
    return new Promise(resolve => {
        // create a simple message that moves coin balances
        const send1 = new MsgSend(
            wallet_from.key.accAddress,
            wallet_to.key.accAddress,
            { uluna: uluna_amount, uusd: uusd_amount }
        );

        wallet_from
            .createAndSignTx({
                msgs: [send1],
                memo: 'Initial Funding!',
            })
            .then(tx => terraClient.tx.broadcast(tx))
            .then(result => {
                console.log(result.txhash);
                resolve(result.txhash);
            });
    })
}


