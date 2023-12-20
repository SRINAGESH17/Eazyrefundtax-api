var admin = require("firebase-admin");

var serviceAccount = require("../eazyrefundtax-de0db-firebase-adminsdk-d0mr5-da39fa21b7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
module.exports = admin