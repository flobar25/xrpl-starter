import * as readline from "readline";
import * as xrpl from "xrpl";
import { AccountSet, Payment, TransactionMetadata, TrustSet } from "xrpl";
import State from "./state/State";

export default class Main {
  state: State = new State();
  async initWallets() {
    // Define the network client
    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
    await client.connect();

    // create cold and how wallet
    var wallet = await client.fundWallet();
    this.state.coldWallet = wallet.wallet;
    wallet = await client.fundWallet();
    this.state.hotWallet = wallet.wallet;

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

    const hot_settings_tx: AccountSet = {
      TransactionType: "AccountSet",
      Account: this.state.hotWallet.address,
      Domain: "6578616D706C652E636F6D", // "example.com"
      // enable Require Auth so we can't use trust lines that users
      // make to the hot address, even by accident:
      SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
      Flags:
        xrpl.AccountSetTfFlags.tfDisallowXRP |
        xrpl.AccountSetTfFlags.tfRequireDestTag,
    };

    const hst_prepared = await client.autofill(hot_settings_tx);
    const hst_signed = this.state.hotWallet.sign(hst_prepared);
    console.log("Sending hot address AccountSet transaction...");
    const hst_result = await client.submitAndWait(hst_signed.tx_blob);
    if (
      (hst_result.result.meta as TransactionMetadata).TransactionResult ==
      "tesSUCCESS"
    ) {
      console.log(
        `Transaction succeeded: https://testnet.xrpl.org/transactions/${hst_signed.hash}`
      );
    } else {
      throw `Error sending transaction: ${hst_result}`;
    }

    // Create trust line from hot to cold address --------------------------------
    const currency_code = "FOO";
    const trust_set_tx: TrustSet = {
      TransactionType: "TrustSet",
      Account: this.state.hotWallet.address,
      LimitAmount: {
        currency: currency_code,
        issuer: this.state.coldWallet.address,
        value: "10000000000", // Large limit, arbitrarily chosen
      },
    };

    const ts_prepared = await client.autofill(trust_set_tx);
    const ts_signed = this.state.hotWallet.sign(ts_prepared);
    console.log("Creating trust line from hot address to issuer...");
    const ts_result = await client.submitAndWait(ts_signed.tx_blob);
    if (
      (ts_result.result.meta as TransactionMetadata).TransactionResult ==
      "tesSUCCESS"
    ) {
      console.log(
        `Transaction succeeded: https://testnet.xrpl.org/transactions/${ts_signed.hash}`
      );
    } else {
      throw `Error sending transaction: ${ts_result}`;
    }

    // Send token ----------------------------------------------------------------
    const issue_quantity = "3840";
    const send_token_tx: Payment = {
      TransactionType: "Payment",
      Account: this.state.coldWallet.address,
      Amount: {
        currency: currency_code,
        value: issue_quantity,
        issuer: this.state.coldWallet.address,
      },
      Destination: this.state.hotWallet.address,
      DestinationTag: 1, // Needed since we enabled Require Destination Tags
      // on the hot account earlier.
    };

    const pay_prepared = await client.autofill(send_token_tx);
    const pay_signed = this.state.coldWallet.sign(pay_prepared);
    console.log(
      `Sending ${issue_quantity} ${currency_code} to ${this.state.hotWallet.address}...`
    );
    const pay_result = await client.submitAndWait(pay_signed.tx_blob);
    if (
      (pay_result.result.meta as TransactionMetadata).TransactionResult ==
      "tesSUCCESS"
    ) {
      console.log(
        `Transaction succeeded: https://testnet.xrpl.org/transactions/${pay_signed.hash}`
      );
    } else {
      throw `Error sending transaction: ${pay_result}`;
    }

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
