const express = require("express");
const { verifyAdmin, verifyCaller } = require("../middlewares/Auth");

const { fetchCalls, updateStatusAndComment } = require("../controllers/Call");
const multer = require("multer");
const route = express.Router();



/**------------------------------------Call------------------------------- */

route.get('/call/fetch',verifyCaller,fetchCalls);
route.put('/call/:callId/update',verifyCaller, updateStatusAndComment);




module.exports = route;
