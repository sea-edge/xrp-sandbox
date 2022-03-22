// In browsers, use a <script> tag. In Node.js, uncomment the following line:
const xrpl = require('xrpl')
const retry = require('async-retry');
require('dotenv').config();



// Wrap code in an async function so we can use await
async function main() {

    const test_wallet = xrpl.Wallet.fromSeed(process.env.SEED)

    console.log(test_wallet)
    // Define the network client
    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
    await client.connect()

    // ... custom code goes here
    // Prepare transaction -------------------------------------------------------
    // const prepared = await client.autofill({
    //     "TransactionType": "Payment",
    //     "Account": test_wallet.address,
    //     "Amount": xrpl.xrpToDrops("100000000"),
    //     "Destination": "rPiffSrXHQ3Yxpo8jSA7LNB9PUPvFcA5SM"
    // })

    // Provide *all* required fields before signing a transaction
    const prepared = {
        "Account": test_wallet.address,// from
        "TransactionType": "Payment",
        "Destination": "rJxbpKy6xYhyi2oGVzoBpuLwARK9oJmye3",//to
        "Amount": "2000000",
        "Flags": 0,
        "LastLedgerSequence": 26173001, // Optional, but recommended. 
        "Fee": "12",
        "Sequence": 26170423, // next tx's this field is +1
    }


    const max_ledger = prepared.LastLedgerSequence
    console.log("Prepared transaction instructions:", prepared)
    console.log("Transaction cost:", xrpl.dropsToXrp(prepared.Fee), "XRP")
    console.log("Transaction expires after ledger:", max_ledger)

    // Sign prepared instructions ------------------------------------------------
    const signed = test_wallet.sign(prepared)
    console.log("Identifying hash:", signed.hash)
    console.log("Signed blob:", signed.tx_blob)

    // Submit signed blob --------------------------------------------------------
    const tx = await client.submitAndWait(signed.tx_blob)
    console.log(tx)
    // const tx = await retrySubmitAndWait(client, signed.tx_blob)


    // Disconnect when done (If you omit this, Node.js won't end the process)
    client.disconnect()
}

const retrySubmitAndWait = async (xrplClient, blob) => {
    return await retry(
        async (bail) => {
            // if anything throws, we retry
            const res = await xrplClient.submitAndWait(blob)
            return res

            //   if (403 === res.status) {
            //     // don't retry upon 403
            //     bail(new Error('Unauthorized'));
            //     return;
            //   }
        },
        {
            retries: 3,
            minTimeout: 100000,
        }
    );

}

main()