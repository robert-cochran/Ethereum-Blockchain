let EncryptedHealthcareData = artifacts.require("EncryptedHealthcareData");

const TEST_DATA0 = web3.fromAscii("sick!");
const TEST_DATA1 = web3.fromAscii("better!");
const PROVIDER = web3.fromAscii("Dr. Doctor");
const SIG_HASH = web3.fromAscii("signedByYourDoctor:)");
const PUB_KEY = web3.fromAscii("Public Key");
let paient, provider, unauthorised;

contract("EncryptedHealthcareData", async (accounts) => {

    before("Setup account, Add data", async() => {
        const instance = await EncryptedHealthcareData.deployed();

        patient = accounts[0];
        provider = accounts[1];
        unauthorised = accounts[2];
        await instance.createAccount(PUB_KEY, {from: patient});
        await instance.createAccount(PUB_KEY, {from: provider});
        await instance.createAccount(PUB_KEY, {from: unauthorised});

        
    });

    it("allows provider to write records when given permission", async () => {
        const instance = await EncryptedHealthcareData.deployed();

        //authorise provider
        await instance.authoriseProvider(provider, {from: patient});

        //Check 'addRecord' returns the right ID 
        let record0ID = await instance.addRecord.call(patient, TEST_DATA0, PROVIDER, SIG_HASH, {from: provider});
        record0ID = record0ID.toNumber();
        assert.equal(record0ID, 0);

         //addRecord
        await instance.addRecord(patient, TEST_DATA0, PROVIDER, SIG_HASH, {from: provider});
    });


    it("writes all record properties correctly as provider", async () => {
        const instance = await EncryptedHealthcareData.deployed();
        record0ID = 0;

        //Check getRecord as patient returns correct data
        record0Data = await instance.getRecord.call(record0ID, {from: patient});
        assert.equal(record0Data, TEST_DATA0);
        record0ProviderAddress = await instance.getRecordAddress.call(record0ID, {from: patient});
        assert.equal(record0ProviderAddress, accounts[1]);
        record0Provider = await instance.getRecordProvider.call(record0ID, {from: patient});
        assert.equal(record0Provider, PROVIDER);
        //since the time is called in the function, not sure if calling time before will match up 
        record0SignedHash = await instance.getRecordSignedHash.call(record0ID, {from: patient});
        assert.equal(record0SignedHash, SIG_HASH);

        //check getPatientRecord as provider returns correct data
        let providerRecord0Data = await instance.getPatientRecord.call(patient, record0ID, {from: provider});
        assert.equal(providerRecord0Data, TEST_DATA0);
        providerRecord0ProviderAddress = await instance.getPatientRecordAddress.call(patient, record0ID, {from: provider});
        assert.equal(providerRecord0ProviderAddress, accounts[1]);
        providerRecord0Provider = await instance.getPatientRecordProvider.call(patient, record0ID, {from: provider});
        assert.equal(providerRecord0Provider, PROVIDER);
        //since the time is called in the function, not sure if calling time before will match up 
        providerRecord0SignedHash = await instance.getPatientRecordSignedHash.call(patient, record0ID, {from: provider});
        assert.equal(providerRecord0SignedHash, SIG_HASH);
    });

    it("writes multiple records correctly as provider", async () => {
        const instance = await EncryptedHealthcareData.deployed();

        //checks ID is incremented after adding another record
        let record1ID = await instance.addRecord.call(patient, TEST_DATA1, PROVIDER, SIG_HASH, {from: provider});
        record1ID = record1ID.toNumber();
        assert.equal(record1ID, 1);
        
        //provider adds another record 
        await instance.addRecord(patient, TEST_DATA1, PROVIDER, SIG_HASH, {from: provider});
        
        //make sure patient can view correct record data 
        record1Data = await instance.getRecord.call(record1ID, {from: patient});
        assert.equal(record1Data, TEST_DATA1);

        //view the record data as provider
        let providerRecord1Data = await instance.getPatientRecord.call(patient, record1ID, {from: provider});
        assert.equal(providerRecord1Data, TEST_DATA1);
    });

    it("returns a revert error when provider tries to write without permission", async() => {
        const instance = await EncryptedHealthcareData.deployed();

        await instance.unauthoriseProvider(provider, {from: patient});
        asyncAssertThrows(
            async () => await instance.addRecord(patient, TEST_DATA1, PROVIDER, SIG_HASH, {from: provider}),
            "Shouldn't have access"
        );
       
    });

    it("returns a revert error when unauthorised tries to write without permission", async() => {
        const instance = await EncryptedHealthcareData.deployed();

        
        asyncAssertThrows(
            async () => await instance.addRecord(patient, TEST_DATA1, PROVIDER, SIG_HASH, {from: unauthorised}),
            "Shouldn't have access"
        );
       
    });

    
    /**
    it("returns nothing with incorrect id")
    */


    // Asserts that an asynchronous function should throw an error (or not)
    const asyncAssertThrows = async (fn, desc, shouldThrow=true) => {
        try{
            await fn();
            if (shouldThrow) {
                assert.fail(Error, null, "No error was caught! - " + desc);
            }
        } catch (e) {
            if (!shouldThrow) {
                assert.fail(null, e, "Unexpected error was thrown! - " + desc);
            }
        }
    };


    /**
    view functions: (what can be viewed publicly and are any of these a problem)
        getRecord
            returns patient encrypted file to patient 
            requires existing account
            test with no account? 
            test with no records?
                necessary?
        getRecordProvider
            returns provider encrypted file to provider
        getPatientRecord
            returns patient encrypted file to anyone
            secure because of encryption
            any reason this would need to be available to everyone?
        getNextAvailableRecordid
            returns next record id to patient
        getPatientNextAvialablerecordid
            returns next record id of patient to anyone 
            any reason this would need to be available to everyone?
        



    write/add functions: (is anyone unauthorised able to add anything?)
        addRecord
            authorised provider can write records signed by them and encrypted by patient 
                require that sender cant authorise themselves (if they are a doctor/authorised address)
        addProviderEncryptedData
            patient can add data that has been signed by provider (and encrypted with providers public key) 
            should a function in the program compute the hash and sign it itself to see that they match up?
                maybe this should be a require (if cheap enough)?

                3030 gas is word count is roughly ~500? 
                also do they mean word as in data length or actual words?
                gas prices:
                    keccak256 (new alias for sha3) is cheapest.

                    Source: Yellow Paper

                    Appendix G mentions the gas cost of sha3 is:

                    30 gas + 6 gas for each word (rounded up) for input data to a SHA3 Keccak-256 operation.
                    Appendix E has the costs for the others.

                    sha256 (SHA2-256) costs:

                    60 gas + 12 gas for each word (rounded up) for input data to a SHA2-256 operation.
                    ripemd is even more expensive:

                    600 gas + 120 gas for each word (rounded up) for input data to a RIPEMD-160 operation.
    */
});