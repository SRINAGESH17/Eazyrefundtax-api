// config/env/production.js

module.exports = {
    database: {
      connectionString: 'mongodb+srv://EazyRefund:ilovecse%40143M@cluster0.tiwqcqc.mongodb.net/eazyrefundtax_prod',
    },
    server: {
      port: process.env.PORT || 8080,
    },
    logging: false,
  };
  