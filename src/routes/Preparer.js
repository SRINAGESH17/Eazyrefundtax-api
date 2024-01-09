const express = require("express");
const { verifyPreparer } = require("../middlewares/Auth");


const multer = require("multer");


const upload = require("../middlewares/upload");
const { clientTaxStats } = require("../controllers/ClientYearlyTaxation");

const route = express.Router();





/**--------------------------------------Client taxations------------------------ */
route.get('/client-yearly-taxations/stats',verifyPreparer,clientTaxStats);








module.exports = route;
