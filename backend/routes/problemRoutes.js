const express = require("express");
const auth = require("../middleware/auth");
const { listProblems, getProblem, createProblem } = require("../controllers/problemController");

const router = express.Router();

router.get("/", auth, listProblems);
router.get("/:id", auth, getProblem);
router.post("/", auth, createProblem);

module.exports = router;