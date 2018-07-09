pragma solidity ^0.4.21;

contract HealthcareData {

    struct Data {
        bytes data;
        address author;
        uint created;
    }

    struct Patient {
        address patient_address;
        mapping (uint => Data) data;
        mapping (address => bool) can_write;
        mapping (address => bool) can_read;
        uint last_id;
        bool exists;
        address guardian;
        address[] readers;
        address[] writers;
        uint reader_index;
        uint writer_index;
    }

    mapping (address => Patient) patients;

    /**
     * Checks if the sender has control over patient's data (i.e. sender is patient 
     * or patient's guardian)
     * @param _patient The address of the patient to be controlled
     */
    modifier canControl(address _patient) {
        require(patients[_patient].exists);
        bool isPatient = msg.sender == _patient;
        bool isGuardian = msg.sender == patients[_patient].guardian;
        require(isPatient || isGuardian);
        _;
    }

    modifier canRead(address _patient, uint _id) {
        bool patientExists = patients[_patient].exists;
        bool hasReadAccess = patients[_patient].can_read[msg.sender];
        bool isOwner = patients[_patient].data[_id].author == msg.sender;
        require(patientExists);
        require(isOwner || hasReadAccess);
        _;
    }

    modifier canWrite(address _patient) {
        require(patients[_patient].exists);
        require(patients[_patient].can_write[msg.sender]);
        _;
    }

    /**
     * Opens a new account for a patient at the given address
     */
    function openAccount() public {
        require(!patients[msg.sender].exists);
        patients[msg.sender] = Patient(
            msg.sender, 0, true, 0, new address[](0), new address[](0), 0, 0
        );
        patients[msg.sender].can_read[msg.sender] = true;
        patients[msg.sender].can_write[msg.sender] = true;
    }

    /**
     * Closes the given patient's account and deletes all their data
     *
     * NOTE: not sure if this is needed
     */
    function closeAccount() public {
        require(patients[msg.sender].exists);
        patients[msg.sender].exists = false;
        patients[msg.sender].can_read[msg.sender] = false;
        patients[msg.sender].can_write[msg.sender] = false;
    }

    /**
     * Attaches a string data to the sender's account, if one exists
     *
     * @param _data The data to add
     * @return Returns the id of the data added
     */
    function addData(bytes _data) public returns (uint id) {
        return addDataForPatient(msg.sender, _data);
    }

    /**
     * Attaches a string data to the given patient's account, if the
     * sender has write access to the patient's account
     *
     * @param _patient The address of the patient to add data for
     * @param _data The data to add
     * @return The id of the new data
     */
    function addDataForPatient(address _patient, bytes _data)
        public
        canWrite(_patient)
        returns (uint id)
    {
        uint new_id = patients[_patient].last_id + 1;
        patients[_patient].last_id = new_id;
        patients[_patient].data[new_id] = Data(_data, msg.sender, block.number);
        return new_id;
    }

    /**
     * Deletes an existing piece of the sender's data
     *
     * @param _id The id of the data to be overwritten
     */
    function deleteData(uint _id) public {
        deleteDataForPatient(msg.sender, _id);
    }

    /**
     * Deletes an existing piece of the sender's data
     *
     * @param _id The id of the data to be overwritten
     */
    function deleteDataForPatient(address _patient, uint _id) 
        public
        canControl(_patient)
    {
        patients[_patient].data[_id].data = new bytes(0);
    }

    /**
     * Allows a patient to view their own data
     *
     * @param _id The id of the data to view
     * @return The data
     */
    function viewData(uint _id) public view returns (bytes data) {
        return requestData(msg.sender, _id);
    }

    /**
     * Allows a healthcare provider to view a patient's data if they
     * have been granted access.
     *
     * @param _patient the address of the patient to get the data of
     * @param _id The id of the data to get
     * @return the requested data
     */
    function requestData(address _patient, uint _id)
        public
        view
        canRead(_patient, _id)
        returns (bytes data)
    {
        require(patients[_patient].last_id >= _id);
        return patients[_patient].data[_id].data;
    }

    /**
     * Allows a patient to grant or deny a healthcare provider write acccess to
     * their account (i.e. to add new data)
     *
     * @param _provider The address of the healthcare provider
     * @param _can_write Whether or not the provider should be able to add new
     * data
     */
    function grantWriteAccess(address _provider, bool _can_write) public {
        grantWriteAccessForPatient(msg.sender, _provider, _can_write);
    }

    /**
     * Allows a user to grant or deny a healthcare provider read acccess to
     * a patient's account (i.e. to add new data)
     *
     * @param _provider The address of the healthcare provider
     * @param _can_read Whether or not the provider should be able to read
     * their data
     */
    function grantReadAccess(address _provider, bool _can_read) public {
        grantReadAccessForPatient(msg.sender, _provider, _can_read);
    }

    /**
     * Allows a user to grant or deny a healthcare provider write acccess to
     * a patient's account (i.e. to add new data)
     *
     * @param _provider The address of the healthcare provider
     * @param _can_write Whether or not the provider should be able to add new
     * data
     */
    function grantWriteAccessForPatient(address _patient, address _provider, bool _can_write) 
        public
        canControl(_patient)
    {
        require(_provider != 0);
        if (_can_write) {
            // Skip adding if it's already in
            if (!patients[_patient].can_write[_provider]) {
                // If the last filled index is less than the length, fill the empty spot up
                if (patients[_patient].writer_index < patients[_patient].writers.length) {
                    patients[_patient].writers[patients[_patient].writer_index] = _provider;
                } else {
                    // The last filled index is at the end of the array
                    // Increase the array size
                    patients[_patient].writers.push(_provider);
                }
                patients[_patient].writer_index++;
            }
        } else if (patients[_patient].writers.length >= 1) {
            // Delete the provider from the list
            uint last_i = patients[_patient].writers.length - 1;
            address last = patients[_patient].writers[last_i];
            for (uint i = 0; i < patients[_patient].writers.length; i++) {
                // Check if this is the item we're searching for
                if (patients[_patient].writers[i] == _provider) {
                    // It is, so replace it with the last one and delete the last one
                    patients[_patient].writers[i] = last;
                    delete patients[_patient].writers[last_i];
                    // Decrement the last filled index
                    patients[_patient].writer_index--;
                }
            }
        }
        patients[_patient].can_write[_provider] = _can_write;
    }

    /**
     * Allows a patient to grant or deny a healthcare provider read acccess to
     * their account (i.e. to add new data)
     *
     * @param _provider The address of the healthcare provider
     * @param _can_read Whether or not the provider should be able to read
     * their data
     */
    function grantReadAccessForPatient(address _patient, address _provider, bool _can_read) 
        public 
        canControl(_patient) 
    {
        require(_provider != 0);
        // Change the readers list
        if (_can_read) {
            // Skip adding if it's alread in
            if (!patients[_patient].can_read[_provider]) {
                // If the last filled index is less than the length, fill the empty spot up
                if (patients[_patient].reader_index < patients[_patient].readers.length) {
                    patients[_patient].readers[patients[_patient].reader_index] = _provider;
                } else {
                    // The last filled index is at the end of the array
                    // Increase the array size
                    patients[_patient].readers.push(_provider);
                }
                patients[_patient].reader_index++;
            }
        } else if (patients[_patient].readers.length >= 1) {
            // Delete the provider from the list
            uint last_i = patients[_patient].readers.length - 1;
            address last = patients[_patient].readers[last_i];
            // Check if this is the item we're searching for
            for (uint i = 0; i < patients[_patient].readers.length; i++) {
                if (patients[_patient].readers[i] == _provider) {
                    // It is, so replace it with the last one and delete the last one
                    patients[_patient].readers[i] = last;
                    delete patients[_patient].readers[last_i];
                    // Decrement the last filled index
                    patients[_patient].reader_index--;
                }
            }
        }
        patients[_patient].can_read[_provider] = _can_read;
    }

    /**
     * Allows a patient (or their guardian) to set their guardian (or remove them)
     *
     * @param _patient The patient's address
     * @param _guardian The address of the guardian whose permissions are being set
     * @param _on Whether or not the guardian should be added or remvoved
     */
    function setGuardian(address _patient, address _guardian, bool _on)
        public
        canControl(_patient) 
    {
        // Remove permissions from the old guardian, if there is one
        address oldGuardian = patients[_patient].guardian;
        if (oldGuardian != 0) {
            patients[_patient].can_read[oldGuardian] = false;
            patients[_patient].can_write[oldGuardian] = false;
        }
        // If adding a guardian, give them the read/write permissions
        if (_on) {
            patients[_patient].guardian = _guardian;
            patients[_patient].can_read[_guardian] = true;
            patients[_patient].can_write[_guardian] = true;
        } else {
            // Old guardian permissions will have already been turned off above
            patients[_patient].guardian = 0;
        }
    }

    /**
     * Gets a patient's highest data record ID
     *
     * @return The patient's last ID
     */
    function getLastId()
        public view
        returns (uint _last_id)
    {
        return getPatientLastId(msg.sender);
    }

    /**
     * Gets a given patient's highest data record ID
     *
     * @param _patient The address of the patient to get the ID for
     * @return The patient's last ID
     */
    function getPatientLastId(address _patient)
        public view
        canRead(_patient, 0)
        returns(uint _last_id)
    {
        return patients[_patient].last_id;
    }

    /**
     * Gets the author of the given record
     *
     * @param _id The id of the record to check
     * @return The author of the given record
     */
    function getDataAuthor(uint _id)
        public view
        returns (address _author)
    {
        return getPatientDataAuthor(msg.sender, _id);
    }

    /**
     * Gets the author of the given patient's given record
     *
     * @param _patient The address of the patient to check
     * @param _id The id of the record to check
     * @return The address of the author of the given record
     */
    function getPatientDataAuthor(address _patient, uint _id)
        public view
        canRead(_patient, _id)
        returns (address _author)
    {
        require(patients[_patient].last_id >= _id);
        return patients[_patient].data[_id].author;
    }

    /**
     * Gets the address of the user's current guardian
     *
     * @return The address of the user's current guardian
     */
    function getCurrentGuardian() public view returns (address _guardian)
    {
        return getPatientCurrentGuardian(msg.sender);
    }

    /**
     * Gets the address of a patient's current guardian
     *
     * @param _patient The patient to check
     * @return The address of the patient's current guardian
     */
    function getPatientCurrentGuardian(address _patient)
        public view
        canControl(_patient)
        returns (address _guardian)
    {
        return patients[_patient].guardian;
    }

    /**
     * Checks whether or not the given sender has an account as a patient
     *
     * @return Whether the sender has a patient account
     */
    function hasAccount()
        public
        view
        returns (bool _has_account)
    {
        return patients[msg.sender].exists;
    }

    /**
     * Gets the patient's list of readers - that is, the list of providers who,
     * currently have access to the patient's data
     *
     * @return An array of provider addresses (each with access to read the patient's data)
     */
    function getReaders()
        public 
        view 
        returns (address[])
    {
        return getPatientReaders(msg.sender);
    }

    /**
     * Gets the patient's list of writers - that is, the list of providers who,
     * currently have access to add to the patient's data
     *
     * @return An array of provider addresses (each with access to add to the patient's data)
     */
    function getWriters()
        public 
        view 
        returns (address[])
    {
        return getPatientWriters(msg.sender);
    }

    /**
     * Gets the given patient's list of readers - that is, the list of providers who,
     * currently have access to the given patient's data
     *
     * @return An array of provider addresses (each with access to read the given patient's data)
     */
    function getPatientReaders(address _patient) 
        public
        view
        canControl(_patient)
        returns (address[])
    {
        return patients[_patient].readers;
    }

    /**
     * Gets the given patient's list of writers - that is, the list of providers who,
     * currently have access to add to the given patient's data
     *
     * @return An array of provider addresses (each with access to add to the given patient's data)
     */
    function getPatientWriters(address _patient) 
        public
        view
        canControl(_patient)
        returns (address[])
    {
        return patients[_patient].writers;
    }
}