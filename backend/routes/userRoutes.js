const express = require("express");
const auth = require("../middleware/auth");
const { getProfile, getLeaderboard } = require("../controllers/userController");

const router = express.Router();

router.get("/me", auth, getProfile);
router.get("/leaderboard", auth, getLeaderboard);

module.exports = router;
