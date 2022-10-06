import * as readline from "readline";
import * as xrpl from "xrpl";

async function initWallets() {
  // Define the network client
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();
  const fund_result = await client.fundWallet();
  const test_wallet = fund_result.wallet;
  console.log(fund_result);
  // ... custom code goes here
  // Disconnect when done (If you omit this, Node.js won't end the process)
  client.disconnect();
}

async function main() {
  console.log("Generating wallets");
  await initWallets();
  console.log("Done");
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

main();
