let HealthcareData = artifacts.require("HealthcareData");

const TEST_DATA = web3.fromAscii("Hello, World!");
let alice, bob, charlie, dale, f, rest;
let data_bob_wrote, data_dale_wrote;

contract("HealthcareData", async (accounts) => {
    before("Setup accounts", async () => {
        const instance = await HealthcareData.deployed();

        // runs before all tests in this block
        [alice, ...rest] = accounts;
        await instance.openAccount({from: alice});

    });

    it("Should record the correct readers", async () => {
        const instance = await HealthcareData.deployed();
        const reader_list = [];
        for (let i = 0; i < 9; i++) {
            await instance.grantReadAccess(rest[i], i % 2 == 1, {from: alice});
            if (i % 2 == 1) {
                reader_list.push(rest[i]);
            }
        }
        const readers = await instance.getReaders({from: alice});
        assert.equal(readers.length, reader_list.length, "Readers lists should be same length");
        for (let i = 0; i < readers.length; i++) {
            assert.include(reader_list, readers[i], "Element should be included");
        }
    });

    it("Should record the correct writers", async () => {
        const instance = await HealthcareData.deployed();
        const writer_list = [];
        for (let i = 0; i < 9; i++) {
            await instance.grantWriteAccess(rest[i], i % 2 == 1, {from: alice});
            if (i % 2 == 1) {
                writer_list.push(rest[i]);
            }
        }
        const writers = await instance.getWriters({from: alice});
        assert.equal(writers.length, writer_list.length, "Writer lists should be same length");
        for (let i = 0; i < writers.length; i++) {
            assert.include(writer_list, writers[i], "Element should be included");
        }
    });

    it("Should record the correct writers after removal", async () => {
        const instance = await HealthcareData.deployed();
        for (let i = 0; i < 9; i++) {
            await instance.grantWriteAccess(rest[i], false, {from: alice});
        }
        const writers = await instance.getWriters({from: alice});
        for (let i = 0; i < writers.length; i++) {
            assert.equal(0, writers[i], "Element should be included");
        }
    });

    it("Should add the writers back efficiently", async () => {
        const instance = await HealthcareData.deployed();
        await instance.grantWriteAccess(rest[0], true, {from: alice});
        const writers = await instance.getWriters({from: alice});
        assert.equal(rest[0], writers[0], "First element should be address");
        for (let i = 1; i < writers.length; i++) {
            assert.equal(0, writers[i], "Element should be included");
        }
    });
});

contract("HealthcareData", async (accounts) => {

    before("Setup accounts and add data", async function() {
        const instance = await HealthcareData.deployed();

        // runs before all tests in this block
        alice = accounts[0];
        await instance.openAccount({from: alice});
    });

    it("should add data correctly", async () => {
        const instance = await HealthcareData.deployed();

        // Add the data
        // Call the transaction first to get the output ID
        let data_id = await instance.addData.call(TEST_DATA, {from: alice});
        data_id = data_id.toNumber();
        assert.equal(data_id, 1, "Should be first data in account");
        await instance.addData(TEST_DATA, {from: alice});

        // View the data
        let data_out = await instance.viewData(data_id, {from: alice});
        assert.equal(data_out, TEST_DATA);

        // Add another piece of data
        data_id = await instance.addData.call(TEST_DATA, {from: alice});
        data_id = data_id.toNumber();
        assert.equal(data_id, 2, "Should be second piece of data in account");
    });

    it("should delete correctly", async () => {
        const instance = await HealthcareData.deployed();

        // Delete the data
        await instance.deleteData(1, {from: alice});

        // View the data
        let data_out = await instance.viewData(1, {from: alice});
        assert.equal(data_out, web3.fromAscii(""));
    });
});

contract("HealthcareData", async (accounts) => {
    before("Setup accounts and add data", async () => {
        const instance = await HealthcareData.deployed();

        // runs before all tests in this block
        [alice, bob, charlie, dale, ...rest] = accounts;
        await instance.openAccount({from: alice});

        // Add some data to account
        await instance.addData(TEST_DATA, {from: alice});
        await instance.addData(TEST_DATA, {from: alice});
        await instance.addData(TEST_DATA, {from: alice});

        // Give no one access
        await instance.grantReadAccess(bob, false, {from: alice});
        await instance.grantReadAccess(charlie, false, {from: alice});
        await instance.grantReadAccess(dale, false, {from: alice});
        await instance.grantWriteAccess(bob, false, {from: alice});
        await instance.grantWriteAccess(charlie, false, {from: alice});
        await instance.grantWriteAccess(dale, false, {from: alice});

        // Bob is guardian
        await instance.setGuardian(alice, bob, true, {from: alice});
    });

    it("Guardian should be able to read and add data", async () => {
        const instance = await HealthcareData.deployed();
        const new_id = await instance.addDataForPatient.call(alice, TEST_DATA, {from: bob});
        await instance.addDataForPatient(alice, TEST_DATA, {from: bob});

        const data_out = await instance.requestData(alice, new_id, {from: bob});
        assert.equal(TEST_DATA, data_out, "Data should match");
    });

    it("Guardian should be able to grant read access", async () => {
        const instance = await HealthcareData.deployed();
        await instance.grantReadAccessForPatient(alice, charlie, true, {from: bob});
        const data_out = await instance.requestData(alice, 1, {from: charlie});
        assert.equal(data_out, TEST_DATA, "data should match");
    });

    it("Guardian should be able to grant write access", async () => {
        const instance = await HealthcareData.deployed();
        await instance.grantWriteAccessForPatient(alice, charlie, true, {from: bob});
        await instance.addDataForPatient(alice, TEST_DATA, {from: charlie});
    });

    it("Guardian should be able to deny read access", async () => {
        const instance = await HealthcareData.deployed();
        await instance.grantReadAccessForPatient(alice, charlie, false, {from: bob});
        asyncAssertThrows(
            async () => await instance.requestData(alice, 1, {from: charlie}),
            "Shouldn't have access"
        );
    });

    it("Guardian should be able to deny write access", async () => {
        const instance = await HealthcareData.deployed();
        await instance.grantReadAccessForPatient(alice, charlie, false, {from: bob});
        asyncAssertThrows(
            async () => await instance.addDataForPatient(alice, TEST_DATA, {from: charlie}),
            "Shouldn't have access"
        );
    });

    it("Guardian should be able to delete data", async () => {
        const instance = await HealthcareData.deployed();
        await instance.deleteDataForPatient(alice, 1, {from: bob});
        const data_out = await instance.requestData(alice, 1, {from: bob});
        assert.equal(data_out, web3.fromAscii(""));
    });

    it("Guardian should be able to set guardian", async () => {
        const instance = await HealthcareData.deployed();
        await instance.setGuardian(alice, dale, true, {from: bob});

        const guardian = await instance.getCurrentGuardian({from: alice});
        assert.equal(dale, guardian, "Dale should be guardian now");
        await instance.setGuardian(alice, bob, true, {from: alice});
    });

    it("Guardian should be able to remove themselves as guardian", async () => {
        const instance = await HealthcareData.deployed();
        await instance.setGuardian(alice, bob, false, {from: bob});

        const guardian = await instance.getCurrentGuardian({from: alice});
        assert.equal(0, guardian, "Dale should be guardian now");
    });
});

contract("HealthcareData", async (accounts) => {
    before("Setup accounts and add data", async () => {
        const instance = await HealthcareData.deployed();

        // runs before all tests in this block
        [alice, bob, charlie, ...d] = accounts;
        await instance.openAccount({from: alice});

        // Add some data to account
        await instance.addData(TEST_DATA, {from: alice});
        await instance.addData(TEST_DATA, {from: alice});
        await instance.addData(TEST_DATA, {from: alice});
    });

    it("should work correctly when Bob has no access", async () => {
        const instance = await HealthcareData.deployed();

        // Things bob should not be allowed to do
        await asyncAssertThrows(
            async () => await instance.addDataForPatient(alice, TEST_DATA, {from: bob}),
            "Shouldn't be allowed to add data for patient"
        );
        await asyncAssertThrows(
            async () => await instance.requestData(alice, 1, {from: bob}),
            "Shouldn't be allowed get data from patient"
        );
        await asyncAssertThrows(
            async () => await instance.deleteDataForPatient(alice, 1, {from: bob}),
            "Shouldn't be allowed to delete patient data"
        );
        await asyncAssertThrows(
            async () => await instance.grantWriteAccessForPatient(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to grant write access for patient"
        );
        await asyncAssertThrows(
            async () => await instance.grantReadAccessForPatient(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to grant read access for patient"
        );
        await asyncAssertThrows(
            async () => await instance.setGuardian(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to set guardian for patient."
        );
    });

    it("should work correctly when Bob has only read access", async () => {
        const instance = await HealthcareData.deployed();

        // Grant read access only
        await instance.grantReadAccess(bob, true, {from: alice});
        await instance.grantWriteAccess(bob, false, {from: alice});

        // Things bob should be allowed to do
        await asyncAssertThrows(
            async () => await instance.requestData(alice, 1, {from: bob}),
            "Should be allowed get data from patient", false
        );

        // Things bob should not be allowed to do
        await asyncAssertThrows(
            async () => await instance.addDataForPatient(alice, TEST_DATA, {from: bob}),
            "Shouldn't be allowed to add data for patient"
        );
        await asyncAssertThrows(
            async () => await instance.deleteDataForPatient(alice, 1, {from: bob}),
            "Shouldn't be allowed to delete patient data"
        );
        await asyncAssertThrows(
            async () => await instance.grantWriteAccessForPatient(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to grant write access for patient"
        );
        await asyncAssertThrows(
            async () => await instance.grantReadAccessForPatient(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to grant read access for patient"
        );
        await asyncAssertThrows(
            async () => await instance.setGuardian(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to set guardian for patient."
        );
    });

    it("should work correctly when Bob has only write access", async () => {
        const instance = await HealthcareData.deployed();

        // Grant write access only
        await instance.grantReadAccess(bob, false, {from: alice});
        await instance.grantWriteAccess(bob, true, {from: alice});

        // Things bob should be allowed to do
        await asyncAssertThrows(
            async () => await instance.addDataForPatient(alice, TEST_DATA, {from: bob}),
            "Should be allowed to add data for patient", false
        );

        // Things bob should not be allowed to do
        await asyncAssertThrows(
            async () => await instance.deleteDataForPatient(alice, 1, {from: bob}),
            "Shouldn't be allowed to delete patient data"
        );
        await asyncAssertThrows(
            async () => await instance.requestData(alice, 1, {from: bob}),
            "Shouldn't be allowed get data from patient"
        );
        await asyncAssertThrows(
            async () => await instance.grantWriteAccessForPatient(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to grant write access for patient"
        );
        await asyncAssertThrows(
            async () => await instance.grantReadAccessForPatient(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to grant read access for patient"
        );
        await asyncAssertThrows(
            async () => await instance.setGuardian(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to set guardian for patient."
        );
    });

    it("should work correctly when Bob has read and write access", async () => {
        const instance = await HealthcareData.deployed();

        // Grant write access only
        await instance.grantReadAccess(bob, true, {from: alice});
        await instance.grantWriteAccess(bob, true, {from: alice});

        // Things bob should be allowed to do
        await asyncAssertThrows(
            async () => await instance.addDataForPatient(alice, TEST_DATA, {from: bob}),
            "Should be allowed to add data for patient", false
        );
        await asyncAssertThrows(
            async () => await instance.requestData(alice, 1, {from: bob}),
            "Shouldn't be allowed get data from patient", false
        );

        // Things bob should not be allowed to do
        await asyncAssertThrows(
            async () => await instance.deleteDataForPatient(alice, 1, {from: bob}),
            "Should be allowed to delete patient data"
        );
        await asyncAssertThrows(
            async () => await instance.grantWriteAccessForPatient(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to grant write access for patient"
        );
        await asyncAssertThrows(
            async () => await instance.grantReadAccessForPatient(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to grant read access for patient"
        );
        await asyncAssertThrows(
            async () => await instance.setGuardian(alice, bob, true, {from: bob}),
            "Shouldn't be allowed to set guardian for patient."
        );
    });

    it("should work correctly when Bob is a guardian", async () => {
        const instance = await HealthcareData.deployed();

        // Remove read/write access to get rid of false positives
        await instance.grantReadAccess(bob, false, {from: alice});
        await instance.grantWriteAccess(bob, false, {from: alice});

        // Grant write access only
        await instance.setGuardian(alice, bob, true, {from: alice});

        // Things bob should be allowed to do
        await asyncAssertThrows(
            async () => await instance.requestData(alice, 1, {from: bob}),
            "Should be allowed get data from patient", false
        );
        await asyncAssertThrows(
            async () => await instance.addDataForPatient(alice, TEST_DATA, {from: bob}),
            "Should be allowed to add data for patient", false
        );
        await asyncAssertThrows(
            async () => await instance.deleteDataForPatient(alice, 1, {from: bob}),
            "Should be allowed to delete patient data", false
        );
        await asyncAssertThrows(
            async () => await instance.grantWriteAccessForPatient(alice, charlie, true, {from: bob}),
            "Should be allowed to grant write access for patient", false
        );
        await asyncAssertThrows(
            async () => await instance.grantReadAccessForPatient(alice, charlie, false, {from: bob}),
            "Should be allowed to grant read access for patient", false
        );
        await asyncAssertThrows(
            async () => await instance.setGuardian(alice, bob, true, {from: bob}),
            "Should be allowed to set guardian for patient.", false
        );

        // Things charlie should not be allowed to do
        // - Charlie should now be able to write, but not read
        await asyncAssertThrows(
            async () => await instance.requestData(alice, 1, {from: bob}),
            "Shouldn't be allowed get data from patient"
        );
        await asyncAssertThrows(
            async () => await instance.addDataForPatient(alice, TEST_DATA, {from: bob}),
            "Should be allowed to add data for patient", false
        );
    });
});

contract("HealthcareData", async (accounts) => {

    before("Setup accounts and add data", async function() {
        const instance = await HealthcareData.deployed();

        // runs before all tests in this block
        [alice, bob, charlie, dale, ...f] = accounts;
        await instance.openAccount({from: alice});


        // Alice adds some data
        await instance.addData(TEST_DATA, {from: alice});
        await instance.addData(TEST_DATA, {from: alice});

        // Bob adds some data
        await instance.grantWriteAccess(bob, true, {from: alice});
        data_bob_wrote = await instance.addDataForPatient.call(alice, TEST_DATA, {from: bob});
        data_bob_wrote = data_bob_wrote.toNumber();
        await instance.addDataForPatient(alice, TEST_DATA, {from: bob});
        await instance.grantWriteAccess(bob, false, {from: alice});

        // Charlie is a guardian
        await instance.setGuardian(alice, charlie, true, {from: alice});

        // Dale adds some data
        await instance.grantWriteAccess(dale, true, {from: alice});

        data_dale_wrote = await instance.addDataForPatient.call(alice, TEST_DATA, {from: dale});
        data_dale_wrote = data_dale_wrote.toNumber();

        await instance.addDataForPatient(alice, TEST_DATA, {from: dale});
        await instance.grantWriteAccess(dale, false, {from: alice});
    });

    it("should let authors view data they've written", async () => {
        const instance = await HealthcareData.deployed();

        // Make sure bob has no access
        await instance.grantReadAccess(bob, false, {from: alice});
        let data_out = await instance.requestData.call(alice, data_bob_wrote, {from: bob});
        assert.equal(data_out, TEST_DATA, "Data should match input");
        asyncAssertThrows(
            async () => await instance.requestData.call(alice, data_bob_wrote - 1, {from: bob}),
            "Shouldn't be able to access alice's data"
        );
        asyncAssertThrows(
            async () => await instance.requestData.call(alice, data_dale_wrote, {from: bob}),
            "Should be able to access stuff writen by other people"
        );
    });

    it("should let patients, guardians and providers with access view their last id", async () => {
        const instance = await HealthcareData.deployed();

        assert.equal(
            (await instance.getLastId.call({from: alice})).toNumber(),
            data_dale_wrote, "Alice should be able to get her last id"
        );

        assert.equal(
            (await instance.getPatientLastId.call(alice, {from: alice})).toNumber(),
            data_dale_wrote, "Alice should be able to get her last id w/ getPatientLastId"
        );

        assert.equal(
            (await instance.getPatientLastId.call(alice, {from: charlie})).toNumber(),
            data_dale_wrote, "Guardian should be able to get last id"
        );

        // Make sure bob has access
        await instance.grantReadAccess(bob, true, {from: alice});
        assert.equal(
            (await instance.getPatientLastId.call(alice, {from: bob})).toNumber(),
            data_dale_wrote, "Alice should be able to get her last i"
        );
        await instance.grantReadAccess(bob, false, {from: alice});
    });


    it("should let patients, guardians and providers with access view a data author", async () => {
        const instance = await HealthcareData.deployed();
        assert.equal(
            await instance.getDataAuthor.call(data_bob_wrote, {from: alice}),
            bob, "Alice should be able to get an author for data"
        );

        assert.equal(
            await instance.getPatientDataAuthor.call(alice, data_bob_wrote, {from: charlie}),
            bob, "Guardian should be able to alice's last id"
        );

        assert.equal(
            await instance.getPatientDataAuthor.call(alice, data_bob_wrote, {from: bob}),
            bob, "Author should be able to check that they authored data"
        );

        await instance.grantReadAccess(dale, true, {from: alice});
        assert.equal(
            await instance.getPatientDataAuthor.call(alice, data_bob_wrote, {from: dale}),
            bob, "Provider w/ acces should be able to check data author"
        );
    });

    it("should let patients and guardians view the guardian", async () => {
        const instance = await HealthcareData.deployed();
        assert.equal(
            await instance.getCurrentGuardian.call({from: alice}),
            charlie, "Alice should be able to get an author for data"
        );

        assert.equal(
            await instance.getPatientCurrentGuardian.call(alice, {from: charlie}),
            charlie, "Guardian should be able to alice's last id"
        );

    });

    it("should restrict providers without access from viewing a patient's last id, guardian and data author", async () => {
        const instance = await HealthcareData.deployed();
        
        await instance.grantReadAccess(bob, false, {from: alice});
        await instance.grantReadAccess(dale, false, {from: alice});

        // Data author
        asyncAssertThrows(
            async () => {
                await instance.getPatientDataAuthor(alice, data_bob_wrote, {from: dale});
            }, "User w/out read access should not be able to view author of data they did not author (1)"
        );
        asyncAssertThrows(
            async () => {
                await instance.getPatientDataAuthor(alice, data_dale_wrote, {from: bob});
            }, "User w/out read access should not be able to view author of data they did not author (2)"
        );
        asyncAssertThrows(
            async () => {
                await instance.getPatientDataAuthor(alice, 1, {from: dale});
            }, "User w/out read access should not be able to view author of data authored by patient (1)"
        );
        asyncAssertThrows(
            async () => {
                await instance.getPatientDataAuthor(alice, 1, {from: bob});
            }, "User w/out read access should not be able to view author of data authored by patient (2)"
        );

        // Last ID
        asyncAssertThrows(
            async () => {
                await instance.getPatientLastId(alice, {from: dale});
            }, "User w/out read access should not be able to view last id (1)"
        );
        asyncAssertThrows(
            async () => {
                await instance.getPatientLastId(alice, {from: bob});
            }, "User w/out read access should not be able to view last id (2)"
        );

        await instance.grantWriteAccess(bob, true, {from: alice});
        await instance.grantWriteAccess(dale, true, {from: alice});

        asyncAssertThrows(
            async () => {
                await instance.getPatientLastId(alice, {from: dale});
            }, "User w/ write access should not be able to view last id (1)"
        );
        asyncAssertThrows(
            async () => {
                await instance.getPatientLastId(alice, {from: bob});
            }, "User w/ write access should not be able to view last id (2)"
        );
        
        // Guardian
        await instance.grantWriteAccess(bob, false, {from: alice});
        await instance.grantWriteAccess(dale, false, {from: alice});

        asyncAssertThrows(
            async () => {
                await instance.getPatientCurrentGuardian(alice, {from: dale});
            }, "Non-patient/guardian user shouldn't be able to view patient's guardian (1)"
        );
        asyncAssertThrows(
            async () => {
                await instance.getPatientDataAuthor(alice, {from: bob});
            }, "Non-patient/guardian user shouldn't be able to view patient's guardian (2)"
        );

        await instance.grantWriteAccess(bob, true, {from: alice});
        await instance.grantWriteAccess(dale, true, {from: alice});

        asyncAssertThrows(
            async () => {
                await instance.getPatientCurrentGuardian(alice, {from: dale});
            }, "Non-patient/guardian user w/ write access shouldn't be able to view patient's guardian (1)"
        );
        asyncAssertThrows(
            async () => {
                await instance.getPatientDataAuthor(alice, {from: bob});
            }, "Non-patient/guardian user w/ write access shouldn't be able to view patient's guardian (2)"
        );

        await instance.grantReadAccess(bob, false, {from: alice});
        await instance.grantReadAccess(dale, false, {from: alice});

        asyncAssertThrows(
            async () => {
                await instance.getPatientCurrentGuardian(alice, {from: dale});
            }, "Non-patient/guardian user w/ read & write access shouldn't be able to view patient's guardian (1)"
        );
        asyncAssertThrows(
            async () => {
                await instance.getPatientDataAuthor(alice, {from: bob});
            }, "Non-patient/guardian user w/ read & write access shouldn't be able to view patient's guardian (2)"
        );
    });
});

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