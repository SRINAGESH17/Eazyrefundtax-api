require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./index');

const dburl = config.database.connectionString;
console.log(dburl)


 mongoose.connect(dburl,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  
});

   const db = mongoose.connection;
module.exports=db;
