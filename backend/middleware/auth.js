const { verifyAccessToken } = require("../utils/jwt");

const attachUser = (decoded) => ({
  _id: decoded.id,
  id: decoded.id,
  handle: decoded.handle,
  role: decoded.role,
});

module.exports = async (req, res, next) => {
  let token = req.cookies?.accessToken;

  const authHeader = req.headers.authorization;
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = attachUser(decoded);
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};