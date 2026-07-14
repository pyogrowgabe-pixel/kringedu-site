const crypto = require("crypto");

const COOKIE_NAME = "kringedu_auth";

const getSecret = () => process.env.APP_AUTH_SECRET || process.env.APP_PASSWORD || "";

const createToken = () => {
  const secret = getSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update("kringedu-content-studio").digest("hex");
};

const parseCookies = (req) => {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
  );
};

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const isConfigured = () => Boolean(process.env.APP_PASSWORD);

const isAuthorized = (req) => {
  if (!isConfigured()) return false;
  const cookies = parseCookies(req);
  return safeEqual(cookies[COOKIE_NAME], createToken());
};

const authCookie = () => {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${COOKIE_NAME}=${createToken()}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=604800`;
};

const clearCookie = () => `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;

module.exports = {
  authCookie,
  clearCookie,
  isAuthorized,
  isConfigured,
  safeEqual
};
