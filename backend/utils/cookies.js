const isCrossOriginDeployment = () => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return (
    process.env.NODE_ENV === "production" &&
    !frontendUrl.includes("localhost")
  );
};

const getSameSite = () => {
  const explicit = process.env.COOKIE_SAME_SITE;
  if (explicit === "none" || explicit === "lax" || explicit === "strict") {
    return explicit;
  }
  // Vercel proxies /api on the same domain as the SPA — lax works everywhere
  // (Safari/Firefox often block or mishandle SameSite=None even on same-site).
  if (isCrossOriginDeployment()) {
    return "lax";
  }
  return "lax";
};

const getBaseCookieOptions = () => {
  const crossOrigin = isCrossOriginDeployment();
  const sameSite = getSameSite();
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    (crossOrigin && process.env.COOKIE_SECURE !== "false");

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
};

const getAccessCookieOptions = () => ({
  ...getBaseCookieOptions(),
  maxAge: 15 * 60 * 1000,
});

const getRefreshCookieOptions = () => ({
  ...getBaseCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const clearAuthCookieOptions = () => getBaseCookieOptions();

module.exports = {
  getAccessCookieOptions,
  getRefreshCookieOptions,
  clearAuthCookieOptions,
};