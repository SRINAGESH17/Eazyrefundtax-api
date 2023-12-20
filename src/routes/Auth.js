const express = require("express")
const route = express.Router();
const { isAuth } = require("../middlewares/Auth");
const { createAdmin, getRole } = require("../controllers/Auth");

route.get('/role',isAuth,getRole);
route.post('/admin/create',createAdmin);


module.exports = route;
