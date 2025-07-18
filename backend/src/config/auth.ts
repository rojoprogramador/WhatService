export default {
  secret: process.env.JWT_SECRET || "mysecret",
  expiresIn: process.env.NODE_ENV === "development" ? "8h" : "15m", // 8 horas en desarrollo
  refreshSecret: process.env.JWT_REFRESH_SECRET || "myanothersecret",
  refreshExpiresIn: "7d"
};
