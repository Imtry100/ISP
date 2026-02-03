const cors = require('cors');
const config = require('../config');

module.exports = cors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders
});
