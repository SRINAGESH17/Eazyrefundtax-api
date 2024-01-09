const express = require("express")
const route = express.Router();
const { isAuth } = require("../middlewares/Auth");
const { createAdmin, getRole, updatePassword } = require("../controllers/Auth");
const { fetchSlotNames } = require("../controllers/Call");
const { createClient, getActiveClientYearlyTaxations } = require("../controllers/Client");
const { getActivePreparers } = require("../controllers/Preparer");

route.get('/role',isAuth,getRole);
route.post('/admin/create',createAdmin);

/**-----------------------------Calls-------------------------------------- */
route.get("/call/slots",isAuth,fetchSlotNames);

/**--------------------------------Client-------------------------------- */
route.post("/client/create",createClient)
route.get("/client/active",isAuth,getActiveClientYearlyTaxations);

/**---------------------------------Preparer------------------------------ */
route.get("/preparer/active",isAuth,getActivePreparers);

/**-------------------------------Password changes------------------ */
route.get("/password/update",isAuth,updatePassword);



module.exports = route;
