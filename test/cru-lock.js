const config = require('./../config/infeos_config.json');
const testConfig = require('./../config/cru_test_config.json');
const infeos = require('infeos').init();
const {assertThrowsAsync, getTable, getLastTransactionId, getNextHistoryId, delay} = require('./include/functions')
const EOSIOApi = infeos.EOSIOApi;
const EOSIORpc = infeos.EOSIOApi.rpc;


describe('TokenLock Contract Tests', function() {
    let eosioTest;
    let account;
    let tokenLockContractInstance;
    let isContractDeployed;
    let idIncremental = 0

    before(async () => {
        account = new infeos.EOSIOAccount(config.tokenlock.name, config.tokenlock.permissions.system.publicKey,
            config.tokenlock.permissions.system.publicKey)
        tokenLockContractInstance = new infeos.EOSIOContract(config.tokenLockContract, account);
    });


    it("[Non-existing] - Should add user with algorithm 0 to " + config.accounts[1].name, async () => {
        let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[1].name, 'CRU')
        await tokenLockContractInstance.add(config.accounts[1].name,
            await getNextHistoryId(config.accounts[1].name), 0, "2020-04-08T16:11:22", 0, 1000000)
        let historyTable = await getTable(config.tokenLockContract, config.accounts[1].name, 'history')
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[1].name, 'CRU')
        assert.strictEqual(config.accounts[1].name, historyTable.rows[historyTable.rows.length - 1].username,
            'User name  [${config.accounts[1].name}] was expected')
        assert.strictEqual(balance[0], Number.parseInt(initialBalance[0].split(" ")) + 1000000 + " CRU",
            'Balance value does not match to expected one ' + balance[0])
    });

    it("[Non-existing] - Should add user with algorithm 1 to " + config.accounts[2].name, async () => {
        let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[2].name, 'CRU')
        await tokenLockContractInstance.add(config.accounts[2].name, await getNextHistoryId(config.accounts[2].name), 0,
            "2019-05-08T16:11:22", 1, 1000000)
        let historyTable = await getTable(config.tokenLockContract, config.accounts[2].name, 'history')
        let lockTable = await getTable(config.tokenLockContract, config.accounts[2].name, 'locks')
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[2].name, 'CRU')
        assert.strictEqual("1000000 CRU", lockTable.rows[0].amount, 'Table lock should contains allocation of 1000000 CRU')
        assert.strictEqual(config.accounts[2].name, historyTable.rows[0].username, 'User name  [${config.accounts[2].name}] was expected')
        assert.strictEqual(balance[0], initialBalance[0], 'Balance value does not match to expected one ' + balance[0])
    });

    it("[Non-existing] - Should add user with algorithm 2 to " + config.accounts[3].name, async () => {
        let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[3].name, 'CRU')
        await tokenLockContractInstance.add(config.accounts[3].name, await getNextHistoryId(config.accounts[3].name), 0,
            "2019-01-08T16:11:22", 2, 1000000)
        let historyTable = await getTable(config.tokenLockContract, config.accounts[3].name, 'history')
        let lockTable = await getTable(config.tokenLockContract, config.accounts[3].name, 'locks')
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[3].name, 'CRU')
        assert.strictEqual("1000000 CRU", lockTable.rows[0].amount, 'Table lock should contains allocation of 1000000 CRU')
        assert.strictEqual(config.accounts[3].name, historyTable.rows[0].username, 'User name  [${config.accounts[3].name}] was expected')
        assert.strictEqual(balance[0], initialBalance[0], 'Balance value does not match to expected one ' + balance[0])
    });

    it("[Add+Debt-Single record] - Should add user with algorithm 0 to " + config.accounts[1].name + " and negative balance to make a debt", async () => {
        let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[1].name, 'CRU')
        let initialDebtTable = await getTable(config.tokenLockContract, config.accounts[1].name, 'debts')

        await tokenLockContractInstance.add(config.accounts[1].name,
            await getNextHistoryId(config.accounts[1].name), 0, "2020-04-08T16:11:22", 0, -1000000)
        let historyTable = await getTable(config.tokenLockContract, config.accounts[1].name, 'history')
        let debtTable = await getTable(config.tokenLockContract, config.accounts[1].name, 'debts')
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[1].name, 'CRU')

        assert.strictEqual(debtTable.rows.length, 1,
            'Debt record should contain only single item')
        assert.strictEqual(debtTable.rows[0].amount,
            initialDebtTable.rows.length ? Number.parseInt(initialDebtTable.rows[0].amount.split(" ")) - 1000000 + " CRU" :
                "-1000000 CRU",
            'Debt balance is not corrent,  ' + debtTable.rows[0].amount + ' was expected')
        assert.strictEqual(config.accounts[1].name, historyTable.rows[historyTable.rows.length - 1].username,
            'User name  [${config.accounts[1].name}] was expected')
        assert.strictEqual(balance[0], Number.parseInt(initialBalance[0].split(" ")) + " CRU",
            'Balance value does not match to expected one ' + balance[0])
    });


    it("[Existing lock object] - Should not add user with algorithm 1 to " + config.accounts[2].name, async () => {
        await assertThrowsAsync(async () => tokenLockContractInstance.add(config.accounts[2].name, (
                () => {
                    let id = getNextHistoryId(config.accounts[2].name)
                    return id > 0 ? id - 1 : 0
                })(),
            0, "2020-04-08T16:11:22", 1, 1000000),
            "assertion failure with message: Operation with current ID is already exist",
            "Lock ID is already there, should throw exception with 500 code")
    });

    it("[Existing lock parent] - Should add user with algorithm 1 to " + config.accounts[1].name + " and reduce lock balance", async () => {
        await tokenLockContractInstance.add(config.accounts[1].name, await getNextHistoryId(config.accounts[1].name), 0,
            "2020-04-08T16:11:22", 1, 5000)
        let lockInitialTable = await getLastTransactionId(config.tokenLockContract, config.accounts[1].name, 'locks')

        await tokenLockContractInstance.add(config.accounts[1].name, await getNextHistoryId(config.accounts[1].name),
            lockInitialTable.id, "2020-04-08T16:11:22", 1, -500)
        let lockTable = await getLastTransactionId(config.tokenLockContract, config.accounts[1].name, 'locks')

        assert.strictEqual(lockTable.amount, Number.parseInt(lockInitialTable.amount.split(" ")) - 500 +
            " CRU", 'Balance value does not match to expected one ' + lockTable.amount)
    });

    it("[Existing lock parent] - Should throw exception for user with algorithm 1 to " + config.accounts[1].name +
        " and tries to increase balance", async () => {
        let lockTable = await getLastTransactionId(config.tokenLockContract, config.accounts[1].name, 'locks')
        await assertThrowsAsync(async () => tokenLockContractInstance.add(config.accounts[1].name,
            await getNextHistoryId(config.accounts[1].name), lockTable.id, "2020-04-08T16:11:22", 1, 500),
            "assertion failure with message: Only the ability to reduce balance is available.",
            "Balance should be negative to reduce parent lock")
    });


    it("[Migrate - Lock-300] - Should try to withdraw for " + config.accounts[4].name, async () => {
        let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[4].name, 'CRU')
        await tokenLockContractInstance.add(config.accounts[4].name, await getNextHistoryId(config.accounts[4].name), 0,
            "2019-05-08T16:11:22", 1, 1000000)
        let historyTable = await getTable(config.tokenLockContract, config.accounts[4].name, 'history')
        let lockTable = await getTable(config.tokenLockContract, config.accounts[4].name, 'locks')
        let balance = await EOSIORpc.get_currency_balance('eosio.token', config.accounts[4].name, 'CRU')

        //TODO: need to fix this(should be ise OWNER permissions?)
        await tokenLockContractInstance.migrate(config.accounts[4].name, config.accounts[4].permissions.owner.publicKey)


        assert.strictEqual("1000000 CRU", lockTable.rows[0].amount, 'Table lock should contains allocation of 1000000 CRU')
        assert.strictEqual(config.accounts[4].name, historyTable.rows[0].username, 'User name  [${config.accounts[4].name}] was expected')
        assert.strictEqual(balance[0], initialBalance[0], 'Balance value does not match to expected one ' + balance[0])
    });

    it("[Migrate] - Should migrate  " + config.accounts[1].name, async () => {
        [1, 2, 3, 4].forEach(async (index) => {
            await tokenLockContractInstance.migrate(config.accounts[index].name, config.accounts[index].permissions.owner.publicKey)
            await delay(500)
            let user = await getLastTransactionId(config.tokenLockContract, config.tokenLockContract, 'users')
            assert.strictEqual(user.username, config.accounts[index].name, 'User ' + config.accounts[index].name + ' is not migrated')
        })

    });

    it("[Refresh - Not - Migrated] - Refresh locks for user  unknown should failed", async () => {
        await assertThrowsAsync(async () => tokenLockContractInstance.refresh("unknown", 0),
            "assertion failure with message: User is not migrated",
            "User is not migrated, needs to throw error")
    });

    it("[Refresh-Eligible for distribution] - Refresh locks for user  " + config.accounts[2].name + " and period 1", async () => {
        await tokenLockContractInstance.refresh(config.accounts[2].name, await getNextHistoryId(config.accounts[2].name))
        let lockTable = await getLastTransactionId(config.tokenLockContract, config.accounts[2].name, 'locks')
        //Checking for last_distribution_at
        assert(startDate < new Date(lockTable.last_distribution_at))
    });

    it("[Refresh-Eligible for distribution] - Refresh locks for user  " + config.accounts[3].name + " and period 2", async () => {
        let initialUsers = await getTable(config.tokenLockContract, config.accounts[3].name, 'locks')
        let startDate = new Date()
        assert.strictEqual(initialUsers.rows.length, 1, 'User needs to be migrated, ' +
            'please call migrate first')
        await tokenLockContractInstance.refresh(config.accounts[3].name, await getNextHistoryId(config.accounts[2].name))
        let lockTable = await getLastTransactionId(config.tokenLockContract, config.accounts[2].name, 'locks')
        //Checking for last_distribution_at
        assert(startDate < new Date(lockTable.last_distribution_at))
    });


    it("[Calculation check against Matrix] - Should have the final amount the same as expected in lock table", async () => {
        let calculation = async () => {
            let rs = []
            for(var userIndex in testConfig.accounts) {
                let account = testConfig.accounts[userIndex]

                let transactions = account.transactions.set
                for(var i in transactions) {
                    await delay(500)
                    await tokenLockContractInstance.add(account.name,
                        transactions[i].id, 0, transactions[i].datetime,
                        transactions[i].algorithm.replace("algorithm", ""),
                        transactions[i].amount)
                    await delay(500)
                }

                await tokenLockContractInstance.migrate(account.name, account.permissions.owner.publicKey)

                for(var i in transactions) {
                    await delay(500)
                    if(transactions[i].algorithm.replace("algorithm", "") !== "0") {
                        await tokenLockContractInstance.refresh(account.name, transactions[i].id)
                        await delay(500)
                    }
                }


                let locks = await getTable(config.tokenLockContract, account.name,
                    'locks', limit = 100)

                let initialBalance = await EOSIORpc.get_currency_balance('eosio.token', account.name, 'CRU')
                let debtTable = await getTable(config.tokenLockContract, account.name, 'debts')
                let stats = locks.rows.reduce((sum, value) => {
                        sum.amount += Number.parseInt(value.amount.split(" ")[0])
                        sum.available += Number.parseInt(value.available.split(" ")[0])
                        sum.withdrawed += Number.parseInt(value.withdrawed.split(" ")[0])
                        return sum
                    }, {available: 0, amount: 0, withdrawed: 0}
                )

                let assertObject = {
                    user: account.name,
                    actualBalance: initialBalance,
                    amount: stats.amount,
                    available: stats.available,
                    withdrawed: stats.withdrawed,
                    expected: Number.parseInt(account.transactions.finalAmount),
                    totalAvailable: Number.parseInt((initialBalance.length > 0 ? initialBalance[0].split(" ")[0] : 0)) + stats.available,
                    debt: debtTable.rows.length === 1 ? debtTable.rows[0].amount : 0
                }

                rs.push(assertObject)
            }
            return rs
        }
        let results = await calculation()
        console.log(results)
        results.forEach((rs)=>{
            assert.strictEqual(rs.totalAvailable, rs.expected, 'Balance value does not match to expected one '
                + rs.expected)
        })

    }).timeout(10000000)

    // it("[Withdraw] - Should withdraw to " + config.accounts[2].name + " and update locks table(not full)", async () => {
    //
    // });
    //
    // it("[Withdraw] - Should withdraw to " + config.accounts[3].name + " and erase lock", async () => {
    //
    // });
    //
    // it("[Withdraw] - Should withdraw to " + config.accounts[1].name + " with debt", async () => {
    //
    // });

});
