// app.js


const config = require('../config');
const db= require('../config/database');
const app = require('../config/express');

// ... additional configurations if needed

const port = config.server.port || 4000;

db.on("error", console.error.bind(console, "mongodb connection error found (db):"));
db.once("open", () => {
  console.log("Connected to db");

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
