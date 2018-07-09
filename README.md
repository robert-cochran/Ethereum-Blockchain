# Ethereum Blockchain
A healthcare data server that stores medical records on a blockchain utilizing a standard unencrypted system and an encrypted system to meet privacy needs from using a public blockchain system.

# Pre-Requisites #
To install all of the dependencies for this project you need to have the following things installed:

- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/) (and maybe [yarn](https://yarnpkg.com/en/), too)
- A Web Browser with the [MetaMask browser extension](https://metamask.io/)
- [Ganache](http://truffleframework.com/ganache/) - Truffle's GUI Ethereum blockchain client 

#### NOTES ####

These prerequisites are not necessarily the only options - they're just the ones we used for testing. With configuration, you could use [Mist](https://github.com/ethereum/mist) over MetaMask, and [truffle develop](http://truffleframework.com/docs/getting_started/console) or [geth](https://github.com/ethereum/go-ethereum/wiki/geth) over Ganache (for this, you would have to change the `truffle-config.js` to connect to the client of your choosing), but there may be errors due to slight differences in behaviour or configuration requirements.

# Installation #

To install the dependencies for this project, simply run `yarn install`.

# Running #

## Starting the Server ##

Before starting the server, make sure you have Ganache up and running (it should run on port 7545). It's also a good idea to clean the build files that may be present by running `yarn clean`.

To deploy the contracts and start the server, run `yarn start`. The web app should automatically open in your browser (on https://localhost:3000).

Finally, you need to configure MetaMask to connect to the correct blockchain, with a valid account. MetaMask allows you to connect to any Ethereum network, including many common default options, from the drop down list in the top left of the MetaMask window. You'll have to set up a "Custom RPC" network that connects to Ganache. As mentioned earlier, Ganache runs on http://localhost:7545.

Then you need to add user(s). By default, MetaMask will create an account, but it will have no Ether and, therefore, will be able to perform no transactions. Ganache, though, creates 10 users with 100 Ether each. You can import their accounts by importing their private keys into MetaMask. Their private keys are accessible on the right of each account, in the accounts tab of Ganache. Once you have the private key, you can import them into MetaMask by clicking on the account button in the top right of the MetaMask window and selecting "Import Account").

## Making Changes to the Contracts ##

If you make a change to either of the contracts, you'll have to redeploy them. To do this, stop the server and run `yarn clean` to clean up the precious build files, then `yarn start` to redeploy them and restart the server.

## Using the Web App ##

There are two contracts: one for unencrypted data, and another for encrypted data. The web app reflects this. In the top lefthand corner, there's a lock. Clicking it switches the web app between using the encrypted and the unencrypted contract. When the top bar is light blue, the web app is using the unencrypted contract, and when it's dark blue, it's using the encrypted one.

Whenever you perform an operation that will change the data on the blockchain, you'll be prompted by MetaMask about confirming a transaction. You can set the gas limit on the transaction (among other things). If the gas limit is 0, that means that when MetaMask tried the transaction out locally, it failed. So if you submit the transaction, it will probably fail.

# Use Cases #

These use cases will refer to four users, each with separate addresses and accounts: Alice, Bob, Charlie and Dale. Each account must be imported into MetaMask and, when acting as them, must be the active MetaMask account.

Alice will be a patient, and Bob and Charlie will be providers. Dale will be a Guardian.

#### NOTE: All addresses and private keys should be entered with an "0x" in front of them ####

## Patient Needs to Add and View Data ##

Alice wants to add data to her account and then view it.

### Unencrypted ###

1. Register Alice as a patient on the unencrypted Open Account page
    - Confirm the transaction in the MetaMask popup
    - Refresh the page (there's a small usability bug where the navigation bar doesn't refresh after an account is opened).
2. Go to the unencrypted Add Data page. Enter some data and submit
    - Confirm the transaction in the MetaMask popup
3. Go to the unencrypted View Data page - records and authors are listed.

### Encrypted ###

1. Register Alice as a patient on the encrypted Register Account page
    - There will be two MetaMask notifications to confirm: a "data signing" notification (for deriving the public key) and a "confirm transaction" notification. Confirm both.
    - Wait for page to refresh itself.
4. Go to the encrypted Add Data page. Enter some data and Alice's private key, and submit
    - Confirm the transaction in the MetaMask popup
6. Go to the encrypted View Data page. Enter Alice's private key and submit. Records and authors are listed.

## Provider Needs to Add Patient Data ##

Bob has data that he needs to add to Alice's account.

### Unencrypted ###

1. Switch to Alice's account in MetaMask
2. Open an account for Alice on the unencrypted Open Account page.
3. Go to the edit provider's page. Enter Bob's public address, check "Write" and click "set provider"
    - Depending on previous account activity, there may be up to two transactions needed - confirm them both
4. Refresh the page and Bob will be listed as a provider
5. Switch to Bob's account in MetaMask
6. Go to the Add Patient data page. Enter the data and Alice's public address, then submit
    - Confirm the transaction with MetaMask
7. Switch to Alice's account in MetaMask
    - Refresh the page
8. Go to the View Data page. The newly added data authored by Bob will be listed

### Encrypted ###

1. Switch to Bob's account in MetaMask and refresh the page.
2. Register Bob on the encrypted Register Account page
    - There will be two MetaMask notifications to confirm: a "data signing" notification (for deriving the public key) and a "confirm transaction" notification. Confirm both.
    - Wait for page to refresh itself.
2. Switch to Alice's account in MetaMask and refresh the page.
3. Register Alice on the encrypted Register Account page
    - There will be two MetaMask notifications to confirm: a "data signing" notification (for deriving the public key) and a "confirm transaction" notification. Confirm both.
    - Wait for page to refresh itself.
4. Go to the encrypted Add Provider (Write) page. Enter Bob's public address, and submit
    - Confirm the transaction in the MetaMask popup
5. Switch to Bob's MetaMask account
6. Go to the encrypted Add Patient Data page. Enter Alice's public address, some data and Bob's private key and submit
    - Confirm the transaction in the MetaMask popup
7. Switch to Alice's MetaMask account
8. Go to the View Data page. Enter Alice's private key. The newly added data will be listed.


## Provider Needs to Access Patient Data ##

Bob needs to view the records on Alice's account. The records are authored by Alice, Charlie and himself.

### Unencrypted ###

After performing "Provider Needs to Add Patient Data":

1. Switch to Alice's MetaMask account
2. Go to the Edit Provider's page. Enter Charlie's public address, check "Read" and click "Set Provider"
    - Confirm the MetaMask notification
    - Refresh the page and Charlie will be added as a provider with read privileges
3. Switch to Charlie's MetaMask account
4. Go to the View Patient Data page. Enter Alice's public address and submit. All of Alice's data will be listed.


### Encrypted ###

After performing "Provider Needs to Add Patient Data":

1. Switch to Alice's MetaMask account
2. Go to Add Provider (Read) page. Enter Charlie's public address and Alice's private key, and submit.
    - There should be one transaction for each record in Alice's account. Confirm them all
3. Switch to Charlie's MetaMask account
4. Go to the View Patient Data page. Enter Alice's public address and Charlie's private key, and submit. Alice's data records and authors are listed.


## Patient's Guardian Needs to Give Provider Access ##

Dale needs to give Bob read access to Alice's account.

This use case is only applicable to the unencrypted contract (the encrypted contract does not support guardians).

1. Switch to Alice's MetaMask account.
2. Go to the unencrypted Open Account page, and open an account for Alice.
    - Confirm the MetaMask transaction notification
3. Add some data on Alice's account (for demonstration purposes)
4. Go to the Edit Guardian page
5. Enter Dale's public address and submit
    - Confirm the MetaMask transaction notification
6. Switch to Dale's MetaMask account
7. Go to the Edit Patient Providers page. Enter Alice's public address and submit
8. Enter Bob's public address in the "Add Provider" entry, check "Read" and submit
    - Confirm the MetaMask transaction notification
9. Switch to Bob's MetaMask account.
10. Go to the View Patient Data page. Enter Alice's public address and submit. Alice's data records and authors are listed.

