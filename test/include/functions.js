module.exports = (
    async function assertThrowsAsync(test, error, details) {
        let exception
        try {
            await test();
        } catch(e) {
            exception = e;
        }
        assert.strictEqual(exception ? exception.json.error.details[0].message : exception, error, details)
    }
)
