// app.js


const config = require('../config');
const db= require('../config/database');
const app = require('../config/express');

const port = config.server.port || 4000;

db.on("error", console.error.bind(console, "mongodb connection error found (db):"));
db.once("open", () => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
