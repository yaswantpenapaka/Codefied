const { verifyAccessToken } = require("../utils/jwt");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  let token;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      handle: decoded.handle,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};