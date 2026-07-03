const isCrossOriginDeployment = () => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return (
    process.env.NODE_ENV === "production" &&
    !frontendUrl.includes("localhost")
  );
};

const getRefreshCookieOptions = () => {
  const crossOrigin = isCrossOriginDeployment();
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    (crossOrigin && process.env.COOKIE_SECURE !== "false");

  return {
    httpOnly: true,
    secure,
    sameSite: crossOrigin ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

module.exports = { getRefreshCookieOptions };