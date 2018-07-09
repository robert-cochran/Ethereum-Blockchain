var EncryptedHealthcareData = artifacts.require("./EncryptedHealthcareData.sol");

module.exports = function(deployer) {
  deployer.deploy(EncryptedHealthcareData);
};
