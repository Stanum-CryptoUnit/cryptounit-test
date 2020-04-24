const config = require('./../config/infeos_config.json');
const infeos = require('infeos').init();
const {assertThrowsAsync, getTable} = require('./include/functions')
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
        let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[1].name, 'CRU')
        await tokenLockContractInstance.add(config.accounts[1].name, 0, 0, "2020-04-08T16:11:22", 0, 1000000)
        let historyTable = await getTable(config.tokenLockContract, config.accounts[1].name, 'history')
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[1].name, 'CRU')
        assert.strictEqual(config.accounts[1].name, historyTable.rows[0].username, 'User name  [${config.accounts[1].name}] was expected')
        assert.strictEqual(balance[0], Number.parseInt(initialBalance[0].split(" ")) + 1000000 + " CRU", 'Balance value does not match to expected one ' + balance[0])
    });

    it("[Non-existing] - Should add user with algorithm 1 to " + config.accounts[2].name, async () => {
        let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[2].name, 'CRU')
        await tokenLockContractInstance.add(config.accounts[2].name, 0, 0, "2020-04-08T16:11:22", 1, 1000000)
        let historyTable = await getTable(config.tokenLockContract, config.accounts[2].name, 'history')
        let lockTable = await getTable(config.tokenLockContract, config.accounts[2].name, 'locks')
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[2].name, 'CRU')
        assert.strictEqual("1000000 CRU", lockTable.rows[0].amount, 'Table lock should contains allocation of 1000000 CRU')
        assert.strictEqual(config.accounts[2].name, historyTable.rows[0].username, 'User name  [${config.accounts[2].name}] was expected')
        assert.strictEqual(balance[0], initialBalance[0], 'Balance value does not match to expected one ' + balance[0])
    });

    it("[Existing lock object] - Should not add user with algorithm 1 to " + config.accounts[2].name, async () => {
        await assertThrowsAsync(() => tokenLockContractInstance.add(config.accounts[2].name, 0, 0, "2020-04-08T16:11:22", 1, 1000000),
            "assertion failure with message: Lock object with current ID is already exist",
            "Lock ID is already there, should throw exception with 500 code")
    });

    it("[Non-existing] - Should add user with algorithm 2 to " + config.accounts[3].name, async () => {
        let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[3].name, 'CRU')
        await tokenLockContractInstance.add(config.accounts[3].name, 0, 0, "2020-04-08T16:11:22", 2, 1000000)
        let historyTable = await getTable(config.tokenLockContract, config.accounts[3].name, 'history')
        let lockTable = await getTable(config.tokenLockContract, config.accounts[3].name, 'locks')
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[3].name, 'CRU')
        assert.strictEqual("1000000 CRU", lockTable.rows[0].amount, 'Table lock should contains allocation of 1000000 CRU')
        assert.strictEqual(config.accounts[3].name, historyTable.rows[0].username, 'User name  [${config.accounts[3].name}] was expected')
        assert.strictEqual(balance[0], initialBalance[0], 'Balance value does not match to expected one ' + balance[0])
    });

    it("[Existing lock parent] - Should add user with algorithm 1 to " + config.accounts[1].name + " and reduce lock balance", async () => {
        await tokenLockContractInstance.add(config.accounts[1].name, 1, 0, "2020-04-08T16:11:22", 1, 5000)
        let lockInitialTable = await getTable(config.tokenLockContract, config.accounts[1].name, 'locks')

        await tokenLockContractInstance.add(config.accounts[1].name, 2, 1, "2020-04-08T16:11:22", 1, -500)
        let lockTable = await getTable(config.tokenLockContract, config.accounts[1].name, 'locks')
        assert.strictEqual(lockTable.rows[0].amount, Number.parseInt(lockInitialTable.rows[0].amount.split(" ")) - 500 +
            " CRU", 'Balance value does not match to expected one ' + lockTable.rows[0].amount)
    });

    it("[Existing lock parent] - Should throw exception for user with algorithm 1 to " + config.accounts[1].name +
        " and tries to increase balance", async () => {
        await assertThrowsAsync(() => tokenLockContractInstance.add(config.accounts[1].name, 2, 1, "2020-04-08T16:11:22", 1, 500),
            "assertion failure with message: Only the ability to reduce balance is available.",
            "Balance should be negative to reduce parent lock")
    });

    // it("[Non-existing] - Should add user with algorithm 0 to " + config.accounts[1].name + " and amount of non-existing token", async () => {
    //     await tokenLockContractInstance.add(config.accounts[2].name, 0, 0, "2020-04-08T16:11:22", 0, 1000000)
    // });
    //
    // it("[Migrate - Withdraw] - Should try to withdraw for " + config.accounts[1].name + " and fail", async () => {
    //
    // });
    //
    // it("[Migrate] - Should migrate  " + config.accounts[1].name , async () => {
    //
    // });
    //
    // it("[Migrate] - Check Users Table to observe migrated users ", async () => {
    //
    // });
    //
    // it("[Refresh] - Refresh locks for user  " + config.accounts[1].name + " and period 1" , async () => {
    //
    // });
    //
    // it("[Refresh] - Refresh locks for user  " + config.accounts[1].name + " and period 2" , async () => {
    //
    // });
    //
    // it("[Refresh] - Refresh locks for user  " + config.accounts[1].name + " and period 3" , async () => {
    //
    // });
    //
    // it("[Refresh] - Refresh locks for unknown user "  , async () => {
    //
    // });
    //
    // it("[Refresh] - Refresh locks for unknown user "  , async () => {
    //
    // });
    //
    // it("[Locks] - Check against lock table and user nbalance"  , async () => {
    //
    // });
    //
    // it("[Withdraw] - Should withdraw to " + config.accounts[1].name + " and update locks table", async () => {
    //
    // });


});
