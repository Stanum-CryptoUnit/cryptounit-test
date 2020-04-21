const infeos = require('infeos').init();
const config = require('./../config/infeos_config.json');

const deploy = async () => {
    let tokenLockDeployer = new infeos.EOSIOAccount(config.tokenlock.name, config.tokenlock.permissions.active,
        config.tokenlock.permissions.active);
    let tokenLockContract = new infeos.EOSIODeployer(config.tokenLockContract, tokenLockDeployer, true)
    tokenLockContract = await tokenLockContract.deploy()
};

module.exports = {
    run: deploy
};
