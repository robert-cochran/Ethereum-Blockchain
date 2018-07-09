# How to Run/Deploy Contracts

1. Start local blockchain with [Ganache](http://truffleframework.com/ganache/)
    - Should be running on localhost:8545
2. Run truffle migrate to deploy contracts
3. Can interact with contracts using `truffle console` or via the `web3js` object on web app (injected with [MetaMask browser extension](https://metamask.io/))

# If You Make Changes To A Contract

1. Delete any contract build files in `build\`
2. Restart Ganache (if you have it open)
3. Re-run `truffle migrate`
4. Double check that the changes haven't broken the tests by running `truffle test` (with Ganache open)
    - If they have, either fix the introduced bugs or update the tests to match the new implementation