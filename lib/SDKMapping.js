const sdks = { }

const assign = (spec, sdk) => sdks[spec] = { ...sdks[spec], ...sdk }
const get    =  spec       => sdks[spec]

exports.get    = get
exports.assign = assign