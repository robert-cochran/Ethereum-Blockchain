var HealthcareData = artifacts.require("./HealthcareData.sol");

module.exports = function(deployer) {
  deployer.deploy(HealthcareData);
};
