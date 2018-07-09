pragma solidity ^0.4.21;

contract EncryptedHealthcareData {

    struct Record{
        bytes data;
        address providerAddress; 
        string provider;
        uint created;
        bytes signedHash;
    }

    struct Patient {
        address patientAddress;
        mapping (address => bool) authorisedProviders;
        mapping (uint => Record) encryptedData; 
        mapping (address => Record) sentEncryptedData;
        uint nextAvailableRecordId;
        bool exists; 
        mapping (address => ProvidersRecords) providers;
    }

    struct ProvidersRecords {
        mapping (uint => Record) records;
        uint upToId;
    }

    struct PublicKey {
        address person;
        string publicKey;
        bool exists;
    }

    mapping (address => PublicKey) public publicKeys;

    /**
     * Patient list indexed by patient's address 
     */
    mapping (address => Patient) private patients;


    
    /**
    * Checks if the Patient has registered an account with the address used
    * 
    * @param _patient The patient's address
    */
    modifier patientExists(address _patient) {
        require(patients[_patient].exists);
        require(publicKeys[_patient].exists);
        _;
    }

    /**
    * Checks if the patient has a registered public key to encrypt and decrypt records with
    *
    * @param _person The patient's address
    */
    modifier personExists(address _person) {
        require(publicKeys[_person].exists);
        _;
    }


    /**
     * Creates an account for the address specified 
     * 
     * Requirement: msg.sender cannot already have an account
    */
    function createAccount(string _public_key) 
        public
    {
        require(!patients[msg.sender].exists);
        patients[msg.sender].patientAddress = msg.sender;
        patients[msg.sender].nextAvailableRecordId = 0;
        patients[msg.sender].exists = true;
        // Patients are authorised by default
        patients[msg.sender].authorisedProviders[msg.sender] = true;
        registerPublicKey(_public_key);
    }

    function registerPublicKey(string _public_key)
        public
    {
        require(!publicKeys[msg.sender].exists);
        publicKeys[msg.sender] = PublicKey(msg.sender, _public_key, true);
    }

    /**
     * Sender adds a record to the end of patientAddress's Records list only if the sender is authorised
     * 
     * Requirement: msg.sender has permission to write
     * 
     * @param _patient - address of the account
     * @param _data - data to be written
     * @return the next available record id 
     */ 
    function addRecord(address _patient, bytes _data, string _provider, bytes signedHash) 
        public 
        patientExists(_patient)
        personExists(msg.sender)
        returns(uint)
    {
        require(patients[_patient].authorisedProviders[msg.sender]);
        uint nextAvailableRecordId = patients[_patient].nextAvailableRecordId;
        patients[_patient].encryptedData[nextAvailableRecordId] = Record(_data, msg.sender, _provider, block.number, signedHash);
        patients[_patient].providers[msg.sender].records[nextAvailableRecordId] = Record(_data, msg.sender, _provider, block.number, signedHash);
        patients[_patient].nextAvailableRecordId = nextAvailableRecordId + 1;
        return (nextAvailableRecordId);
    }

    /**
     * Returns a single Record at given id from senders Records
     * 
     * Restriction: msg.sender has to have an attached account
     * 
     * @param _id - used to find record indexed at 'id'
     * @return data of given record 
     */ 
    function getRecord(uint _id) 
        public 
        view 
        patientExists(msg.sender)
        returns(bytes)
    {
        return (patients[msg.sender].encryptedData[_id].data); 
    }

    /**
     * Retrieves the (encrypted) record at index 'id' of the given address
     * 
     * @param _patient - address of the patient's account
     * @param _id - index of record to return
     * @return patient's data at index 'id'  
     */ 
    function getPatientRecord(address _patient, uint _id) 
        public 
        view 
        patientExists(_patient)
        personExists(msg.sender)
        returns(bytes)
    {
        return (patients[_patient].providers[msg.sender].records[_id].data);    
    }

    /**
     * Returns a collection of data attatched to the specified record
     * 
     * @param _patient specified patient's address
     * @param _id record's id
     * @return a tuple of the records data, signed hash, providers address and 
     * time created
     */
    function getRecordWithMetaDataAsProvider(address _patient, uint _id) 
        public 
        view 
        patientExists(_patient)
        personExists(msg.sender)
        returns(bytes, bytes, address, uint)
    {
        return (
            patients[_patient].providers[msg.sender].records[_id].data,
            patients[_patient].providers[msg.sender].records[_id].signedHash,
            patients[_patient].providers[msg.sender].records[_id].providerAddress,
            patients[_patient].providers[msg.sender].records[_id].created
        );
    }

    /**
     * Returns a collection of data for the specified record
     * 
     * @param _id record's id
     * @return a tuple of the records data, signed hash, providers address and 
     * time created
     */
    function getRecordWithMetaDataAsPatient(uint _id) 
        public 
        view 
        patientExists(msg.sender)
        returns(bytes, bytes, address, uint)
    {
        return (
            patients[msg.sender].encryptedData[_id].data,
            patients[msg.sender].encryptedData[_id].signedHash,
            patients[msg.sender].encryptedData[_id].providerAddress,
            patients[msg.sender].encryptedData[_id].created
        );
    }

    /**
     * Retrieves providers address that created the record
     * 
     * @param _id the id of the record
     * @return the providers address
     */
    function getRecordAddress(uint _id)
        public
        view
        patientExists(msg.sender)
        returns (address)
    {
        return (patients[msg.sender].encryptedData[_id].providerAddress);
    }

    /**
     * Retrieves providers address that created the record
     * 
     * @param _patient the patients address
     * @param _id the id of the record
     * @return the providers address
     */
    function getPatientRecordAddress(address _patient, uint _id)
        public
        view
        patientExists(_patient)
        personExists(msg.sender)
        returns (address)
    {
        return (patients[_patient].providers[msg.sender].records[_id].providerAddress);
    }

    /**
     * Retieves the provider that created the record
     * 
     * @param _id the id of the record
     * @return the provider of the record
     */
    function getRecordProvider(uint _id)
        public
        view
        patientExists(msg.sender)
        returns (string)
    {
        return (patients[msg.sender].encryptedData[_id].provider);
    }

    /**
     * Retieves the provider that created the record
     * 
     * @param _patient the patients address
     * @param _id the id of the record
     * @return the provider of the record
     */
    function getPatientRecordProvider(address _patient, uint _id)
        public
        view
        patientExists(_patient)
        personExists(msg.sender)
        returns (string)
    {
        return (patients[_patient].providers[msg.sender].records[_id].provider);
    }
        
     /**
     * Retieves the time the record was created
     * 
     * @param _id the id of the record
     * @return the time the record was created
     */
    function getRecordCreated(uint _id)
        public
        view
        patientExists(msg.sender)
        returns (uint)
    {
        return (patients[msg.sender].encryptedData[_id].created);
    }

    /**
     * Retieves the time the record was created
     * 
     * @param _patient the patients address
     * @param _id the id of the record
     * @return the time the record was created
     */
    function getPatientRecordCreated(address _patient, uint _id)
        public
        view
        patientExists(_patient)
        personExists(msg.sender)
        returns (uint)
    {
        return (patients[_patient].providers[msg.sender].records[_id].created);
    }

    /**
     * Retieves the signed hash by the original provider of the record 
     * 
     * @param _id the id of the record
     * @return the signed hash of the record
     */
    function getRecordSignedHash(uint _id)
        public
        view
        patientExists(msg.sender)
        returns (bytes)
    {
        return (patients[msg.sender].encryptedData[_id].signedHash);
    }

    /**
     * Retieves the signed hash by the original provider of the record 
     * 
     * @param _patient the patients address
     * @param _id the id of the record
     * @return the signed hash of the record
     */
    function getPatientRecordSignedHash(address _patient, uint _id)
        public
        view
        patientExists(_patient)
        returns (bytes)
    {
        return (patients[_patient].providers[msg.sender].records[_id].signedHash);
    }

    /**
     * Returns the first empty Record id
     * 
     * @return the next available id position
     */ 
    function getNextAvailableRecordId() 
        public 
        view 
        patientExists(msg.sender)
        returns(uint)
    {
        return (patients[msg.sender].nextAvailableRecordId);
    }

    /**
     * Returns the id of the last record added by a specific provider
     * 
     * @param _provider the providers address
     * @return id of the last record by provider
     */
    function getLastAddedProviderRecord(address _provider)
        public
        view
        patientExists(msg.sender)
        personExists(_provider)
        returns (uint)
    {
        return patients[msg.sender].providers[_provider].upToId;
    }
     
    /**
     * Returns the first empty Record id
     * 
     * @return nextAvailableRecordId
     */ 
    function getPatientNextAvailableRecordId(address _patient) 
        public 
        view
        patientExists(_patient)
        personExists(msg.sender)
        returns(uint)
    {
        return patients[_patient].providers[msg.sender].upToId;
    }

     /**
     * Gives provider permission to add data
     * 
     * Requirement: a provider cannot authorise themselves 
     * 
     * @param _provider - authorised provider to give write access
     */ 
    function authoriseProvider(address _provider) 
        public
        patientExists(msg.sender)
        personExists(_provider)
    {
        require(_provider != msg.sender);
        patients[msg.sender].authorisedProviders[_provider] = true;
    }
     
    /**
    * Removes provider permission to add data
    * 
    * @param _provider - authorised provider to remove write access
    */ 
    function unauthoriseProvider(address _provider)
        public
        patientExists(msg.sender)
    {
        patients[msg.sender].authorisedProviders[_provider] = false;
    }

    /**
     * Writes a Record that can be indexed by providerAddress from the 
     * patients account
     * 
     * @param _provider - address used to index record with
     * @param _encryptedData - data to be written to record
     * @param _id - id of the record
     */ 
    function addProviderEncryptedData(
        address _provider, bytes _encryptedData, uint _id
    )
        public
        patientExists(msg.sender) 
    {
        // Assume that all previous records have been added for provider
        // (or their ommision was intentional)
        // So, update the id that the provider has up to
        if (_id > patients[msg.sender].providers[_provider].upToId) {
            patients[msg.sender].providers[_provider].upToId = _id;
        }
        // Add the data
        patients[msg.sender].providers[_provider].records[_id].data = _encryptedData;
        // Add in all the metadata related to this record
        bytes storage signedHash = patients[msg.sender].encryptedData[_id].signedHash;
        address author = patients[msg.sender].encryptedData[_id].providerAddress;
        string storage authorName = patients[msg.sender].encryptedData[_id].provider;
        uint dataCreated = patients[msg.sender].encryptedData[_id].created;
        patients[msg.sender].providers[_provider].records[_id].signedHash = signedHash;
        patients[msg.sender].providers[_provider].records[_id].providerAddress = author;
        patients[msg.sender].providers[_provider].records[_id].provider = authorName;
        patients[msg.sender].providers[_provider].records[_id].created = dataCreated;
    }
}
