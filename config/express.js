const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();
const AuthRoute = require('../src/routes/Auth');
const AdminRoute = require('../src/routes/Admin');
const CallerRoute = require('../src/routes/Caller');
const EmployeeRoute = require('../src/routes/Employee');


const app = express();
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

app.use('/api/v1/auth',AuthRoute);
app.use('/api/v1/admin',AdminRoute);
app.use('/api/v1/caller',CallerRoute);
app.use('/api/v1/employee',EmployeeRoute);





module.exports = app;
