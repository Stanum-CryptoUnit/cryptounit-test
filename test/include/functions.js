const infeos = require('infeos').init();
const AssertionError = require('assertion-error');
const EOSIORpc = infeos.EOSIOApi.rpc;

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
    }
}
