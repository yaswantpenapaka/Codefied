const bcrypt = require("bcryptjs");

exports.hashPassword = async (password) => bcrypt.hash(password, 10);
exports.comparePassword = async (password, hash) => bcrypt.compare(password, hash);