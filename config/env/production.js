// config/env/production.js

module.exports = {
    database: {
      connectionString: 'mongodb+srv://EazyRefundTax:ilovecse%40143M@eazyrefundtax.kxem4oy.mongodb.net/eazyrefundtax_prod',
    },
    server: {
      port: process.env.PORT || 8080,
    },
    logging: false,
  };
  