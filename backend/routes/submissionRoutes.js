const express = require("express");
const auth = require("../middleware/auth");
const { runSample, submit } = require("../controllers/submissionController");

const router = express.Router();

router.post("/run/:id", auth, runSample);
router.post("/submit/:id", auth, submit);

module.exports = router;