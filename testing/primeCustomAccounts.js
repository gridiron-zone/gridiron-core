import {
    walletTest1,
    mint_wallet,
} from './constants.js';

import { MsgSend, LCDClient } from '@terra-money/terra.js';

// To use LocalTerra
const terra = new LCDClient({
  URL: 'http://localhost:1317',
  chainID: 'localterra'
});

export const primeAccountsWithFunds = async () => {
    // create a simple message that moves coin balances
    const send = new MsgSend(
        walletTest1.key.accAddress,
        mint_wallet.key.accAddress,
        { uluna: 500000000000000, uusd: 500000000000000 }
    );

    walletTest1
        .createAndSignTx({
            msgs: [send],
            memo: 'Initial Funding!',
        })
        .then(tx => terra.tx.broadcast(tx))
        .then(result => {
            console.log(`TX hash: ${result.txhash}`);
        });
}
