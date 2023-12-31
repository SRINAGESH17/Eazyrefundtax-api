// config/index.js
require('dotenv').config()

const env = process.env.NODE_ENV || 'development';
const config = require(`./env/${env}`);

module.exports = config;
