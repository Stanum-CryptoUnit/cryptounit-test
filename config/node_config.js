const infeos = require('infeos').init();
const config = require('./../config/infeos_config.json');
const testConfig = require('./../config/cru_test_config.json');

/**
 * We execute the node configuration file each time we run a node
 */
const nodeConfig = async () => {

    let EOSIONode = new infeos.EOSIONetwork(config.network.name.EOS);

    EOSIONode.createWallet(config.wallet);
    await EOSIONode.importKey(config.wallet, config.account.permissions.system.privateKey);
    await EOSIONode.importKey(config.wallet, config.account.permissions.owner.privateKey);
    await EOSIONode.importKey(config.wallet, config.account.permissions.active.privateKey);
    await EOSIONode.importKey(config.wallet, config.account.permissions["eosio.code"].privateKey);
    await EOSIONode.createAccount(config.account.name, config.account.permissions.system.publicKey,
        config.account.permissions.system.publicKey);

    /**
     * Deploy eosio.token to eosio.token account
     */
    let eosIoDeployer = new infeos.EOSIOAccount(config.account.name, config.account.permissions.active, config.account.permissions.active);
    let eosIOContract = new infeos.EOSIODeployer(config.systemToken, eosIoDeployer, true);
    eosIOContract = await eosIOContract.deploy();

    /**
     * Setting up Initial env for CRU
     */
    config.accounts.forEach(async (item) => {
            await EOSIONode.createAccount(item.name, item.permissions.system.publicKey,
                item.permissions.system.publicKey)
        }
    )


    /**
     * Create tokens on genesis account(we do assume its the first one in config)
     */
    await eosIOContract.create(config.accounts[0].name, config.accounts[0].eos_balance, "Initial")
    await eosIOContract.issue(config.accounts[0].name, config.accounts[0].eos_balance, "Initial", {
        authorization: {
            actor: config.accounts[0].name,
            permission: "active"
        }
    })

    await eosIOContract.transfer(config.accounts[0].name,
        config.accounts[config.accounts.length - 1].name,
        config.accounts[0].eos_balance,
        "Initial transfer", {
            authorization: {
                actor: config.accounts[0].name,
                permission: "active"
            }
        })


    await eosIOContract.transfer(config.accounts[config.accounts.length - 1].name,
        config.accounts[1].name,
        "1 CRU",
        "Initial transfer", {
            authorization: {
                actor: config.accounts[config.accounts.length - 1].name,
                permission: "active"
            }
        })

    await eosIOContract.transfer(config.accounts[config.accounts.length - 1].name,
        config.accounts[2].name,
        "1 CRU",
        "Initial transfer", {
            authorization: {
                actor: config.accounts[config.accounts.length - 1].name,
                permission: "active"
            }
        })

    console.log("Initial Genesis balance - " + await infeos.EOSIOApi.rpc.get_currency_balance(config.account.name,
        config.accounts[0].name, 'CRU'))

    console.log("Initial Reserve balance - " + await infeos.EOSIOApi.rpc.get_currency_balance(config.account.name,
        config.accounts[config.accounts.length - 1].name, 'CRU'))

    /**
     * Install tokenlock contract to tokenlock account
     */
    await EOSIONode.createAccount(config.tokenlock.name, config.tokenlock.permissions.system.publicKey,
        config.tokenlock.permissions.system.publicKey);
    let tokenLockDeployer = new infeos.EOSIOAccount(config.tokenlock.name, config.tokenlock.permissions.active,
        config.tokenlock.permissions.active);
    let tokenLockContract = new infeos.EOSIODeployer(config.tokenLockContract, tokenLockDeployer, true)
    tokenLockContract = await tokenLockContract.deploy()
    /**
     * Grand eosio.code permission to tokenlock to operate with reserve account
     */
    await new infeos.EOSIOAction().executeAction("eosio", "updateauth",
        [{
            actor: config.accounts[config.accounts.length - 1].name,
            permission: "active"
        }],
        {
            account: config.accounts[config.accounts.length - 1].name,
            permission: "active",
            parent: "owner",
            auth: {
                threshold: 1,
                keys: [
                    {
                        key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                        weight: 1
                    }
                ],
                accounts: [{
                    permission: tokenLockDeployer.basePermissions["eosio.code"],
                    weight: 1
                }],
                waits: []
            }
        }
    )

    config.accounts.forEach(async (item) => {
            await new infeos.EOSIOAction().executeAction("eosio", "updateauth",
                [{
                    actor: item.name,
                    permission: "owner"
                }],
                {
                    account: item.name,
                    permission: "owner",
                    parent: "",
                    auth: {
                        threshold: 1,
                        keys: [
                            {
                                key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                                weight: 1
                            }
                        ],
                        accounts: [{
                            permission: tokenLockDeployer.basePermissions["eosio.code"],
                            weight: 1
                        }],
                        waits: []
                    }
                }
            )
        }
    )

    /**
     * Create users for test matrix
     */
    testConfig.accounts.forEach(async (item) => {
            await EOSIONode.createAccount(item.name, item.permissions.system.publicKey,
                item.permissions.system.publicKey)

            await new infeos.EOSIOAction().executeAction("eosio", "updateauth",
                [{
                    actor: item.name,
                    permission: "active"
                }],
                {
                    account: item.name,
                    permission: "active",
                    parent: "owner",
                    auth: {
                        threshold: 1,
                        keys: [
                            {
                                key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                                weight: 1
                            }
                        ],
                        accounts: [{
                            permission: tokenLockDeployer.basePermissions["eosio.code"],
                            weight: 1
                        }],
                        waits: []
                    }
                }
            )

            await new infeos.EOSIOAction().executeAction("eosio", "updateauth",
                [{
                    actor: item.name,
                    permission: "owner"
                }],
                {
                    account: item.name,
                    permission: "owner",
                    parent: "",
                    auth: {
                        threshold: 1,
                        keys: [
                            {
                                key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                                weight: 1
                            }
                        ],
                        accounts: [{
                            permission: tokenLockDeployer.basePermissions["eosio.code"],
                            weight: 1
                        }],
                        waits: []
                    }
                }
            )
        }
    )
};

module.exports = {
    run: nodeConfig
};
