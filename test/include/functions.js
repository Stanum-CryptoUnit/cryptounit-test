const infeos = require('infeos').init();
const AssertionError = require('assertion-error');
const EOSIORpc = infeos.EOSIOApi.rpc;
const config = require('./../../config/infeos_config.json');


const getLastTransactionId = async (code, scope, table) => {
    let res = await EOSIORpc.get_table_rows({
        json: true,
        code: code,
        scope: scope,
        table: table,
        limit: 100,
        reverse: false,
        show_payer: false
    })
    return res.rows.length > 0 ? res.rows[res.rows.length - 1] : null
}


module.exports = {
    assertThrowsAsync: async (test, error, details) => {
        let exception
        try {
            await test();
        } catch(e) {
            exception = e;
        }
        if((exception ? exception.json.error.details[0].message : exception) !== error)
            throw new AssertionError("Exception:" + error + " should be raised")

    },

    getTable: async (code, scope, table, limit = 10) => {
        return await EOSIORpc.get_table_rows({
            json: true,
            code: code,
            scope: scope,
            table: table,
            limit: limit,
            reverse: false,
            show_payer: false
        })
    },

    getLastTransactionId: getLastTransactionId,

    getNextHistoryId: async (scope) => {
        let rs = await getLastTransactionId(config.tokenLockContract, scope, 'history')
        return rs && ++rs.lock_id || 0
    }
}
