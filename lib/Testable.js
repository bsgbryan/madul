const load = require('./Loader')

const testable = async (spec, sdk = {}) => await load(spec, { root: process.cwd(), sdk })

module.exports = testable