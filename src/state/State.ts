import { Wallet } from "xrpl";

export default class State {
  coldWallet: Wallet;
  hotWallet: Wallet;

  logState() {
    console.log("================= State ===================");
    console.log("Cold wallet");
    console.log(this.coldWallet);
    console.log("Hot wallet");
    console.log(this.hotWallet);
  }
}
