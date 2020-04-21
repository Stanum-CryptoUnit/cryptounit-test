const config = require('./../config/infeos_config.json');
const infeos = require('infeos').init();

const EOSIOApi = infeos.EOSIOApi;
const EOSIORpc = infeos.EOSIOApi.rpc;

describe('TokenLock Contract Tests', function() {
    let eosioTest;
    let account;
    let tokenLockContractInstance;
    let isContractDeployed;

    before(async () => {
        account = new infeos.EOSIOAccount(config.tokenlock.name, config.tokenlock.permissions.system.publicKey,
            config.tokenlock.permissions.system.publicKey)
        tokenLockContractInstance = new infeos.EOSIOContract(config.tokenLockContract, account);
    });


    it("[Non-existing] - Should add user with algorithm 0 to " + config.accounts[1].name, async () => {
        await tokenLockContractInstance.add(config.accounts[1].name, 0, 0, "2020-04-08T16:11:22", 0, 1000000)
        let historyTable = await EOSIORpc.get_table_rows({
            json: true,               // Get the response as json
            code: config.tokenLockContract,      // Contract that we target
            scope: config.accounts[1].name,         // Account that owns the data
            table: 'history',        // Table name
            limit: 10,                // Maximum number of rows that we want to get
            reverse: false,           // Optional: Get reversed data
            show_payer: false          // Optional: Show ram payer
        })
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[1].name, 'CRU')
        assert.strictEqual(config.accounts[1].name, historyTable.rows[0].username, 'User name  [${config.accounts[1].name}] was expected')
        assert.strictEqual(balance[0], "1000000 CRU", 'Balance value does not match to expected one ' + balance[0])
    });

    it("[Non-existing] - Should add user with algorithm 1 to " + config.accounts[2].name, async () => {
        await tokenLockContractInstance.add(config.accounts[2].name, 0, 0, "2020-04-08T16:11:22", 1, 1000000)

    });

    it("[Non-existing] - Should add user with algorithm 2 to " + config.accounts[2].name, async () => {
        await tokenLockContractInstance.add(config.accounts[2].name, 0, 0, "2020-04-08T16:11:22", 2, 1000000)

    });

    it("[Non-existing] - Should add user with algorithm 2 to " + config.accounts[1].name + " and amount of non-existing token", async () => {
        await tokenLockContractInstance.add(config.accounts[2].name, 0, 0, "2020-04-08T16:11:22", 2, 1000000)

    });

    it("[Non-existing] - Should add user with algorithm 0 to " + config.accounts[1].name + " and amount of non-existing token", async () => {
        await tokenLockContractInstance.add(config.accounts[2].name, 0, 0, "2020-04-08T16:11:22", 0, 1000000)

    });

    it("[Migrate - Withdraw] - Should try to withdraw for " + config.accounts[1].name + " and fail", async () => {

    });

    it("[Migrate] - Should migrate  " + config.accounts[1].name , async () => {

    });

    it("[Migrate] - Check Users Table to observe migrated users ", async () => {

    });

    it("[Refresh] - Refresh locks for user  " + config.accounts[1].name + " and period 1" , async () => {

    });

    it("[Refresh] - Refresh locks for user  " + config.accounts[1].name + " and period 2" , async () => {

    });

    it("[Refresh] - Refresh locks for user  " + config.accounts[1].name + " and period 3" , async () => {

    });

    it("[Refresh] - Refresh locks for unknown user "  , async () => {

    });

    it("[Refresh] - Refresh locks for unknown user "  , async () => {

    });

    it("[Locks] - Check against lock table and user nbalance"  , async () => {

    });

    it("[Withdraw] - Should withdraw to " + config.accounts[1].name + " and update locks table", async () => {

    });


});
