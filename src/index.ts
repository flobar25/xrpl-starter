import * as readline from "readline";
import * as xrpl from "xrpl";
import { AccountSet, TransactionMetadata } from "xrpl";
import State from "./state/State";

export default class Main {
  state: State = new State();
  async initWallets() {
    // Define the network client
    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
    await client.connect();

    // create a wallet
    const wallet = await client.fundWallet();
    this.state.coldWallet = wallet.wallet;

    this.state.logState();

    // configure issuer
    const cold_settings_tx: AccountSet = {
      TransactionType: "AccountSet",
      Account: this.state.coldWallet.address,
      TransferRate: 0,
      TickSize: 5,
      Domain: "6578616D706C652E636F6D", // "example.com"
      SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
      // Using tf flags, we can enable more flags in one transaction
      Flags:
        xrpl.AccountSetTfFlags.tfDisallowXRP |
        xrpl.AccountSetTfFlags.tfRequireDestTag,
    };
    const cst_prepared = await client.autofill(cold_settings_tx);
    const cst_signed = this.state.coldWallet.sign(cst_prepared);
    console.log("Sending cold address AccountSet transaction...");
    const cst_result = await client.submitAndWait(cst_signed.tx_blob);
    if (
      (cst_result.result.meta as TransactionMetadata).TransactionResult ==
      "tesSUCCESS"
    ) {
      console.log(
        `Transaction succeeded: https://testnet.xrpl.org/transactions/${cst_signed.hash}`
      );
    } else {
      throw `Error sending transaction: ${cst_result}`;
    }

    // this.state.wallet2 = (await client.fundWallet()).wallet;
    // this.state.wallet3 = (await client.fundWallet()).wallet;
    // this.state.wallet4 = (await client.fundWallet()).wallet;

    client.disconnect();
  }

  async main() {
    console.log("Yo Generating wallets");
    await this.initWallets();
    console.log("Done");
  }
}

// let rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// rl.question("Is this example useful? [y/n] ", (answer) => {
//   switch (answer.toLowerCase()) {
//     case "y":
//       console.log("Super!");
//       break;
//     case "n":
//       console.log("Sorry! :(");
//       break;
//     default:
//       console.log("Invalid answer!");
//   }
//   rl.close();
// });

// // Wrap code in an async function so we can use await
// async function main() {
//   console.log("Hello");
//   // Define the network client
//   const client = new Client("wss://s.altnet.rippletest.net:51233");
//   await client.connect();

//   const fund_result = await client.fundWallet();
//   const test_wallet = fund_result.wallet;
//   console.log(fund_result);

//   // ... custom code goes here

//   // Disconnect when done (If you omit this, Node.js won't end the process)
//   client.disconnect();
//   console.log("Bye");
// }

new Main().main();
