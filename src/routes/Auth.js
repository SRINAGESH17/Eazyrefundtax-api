const express = require("express")
const route = express.Router();
const { isAuth } = require("../middlewares/Auth");
const { createAdmin, getRole } = require("../controllers/Auth");
const { fetchSlotNames } = require("../controllers/Call");
const { createClient } = require("../controllers/Client");

route.get('/role',isAuth,getRole);
route.post('/admin/create',createAdmin);

/**-----------------------------Calls-------------------------------------- */
route.get("/call/slots",isAuth,fetchSlotNames);

/**--------------------------------Client-------------------------------- */
route.post("/client/create",createClient)


module.exports = route;
