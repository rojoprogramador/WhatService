import "../bootstrap";

module.exports = {
  define: {
    charset: "utf8",
    collate: "utf8_general_ci"
  },
  dialect: "postgres",
  timezone: "-03:00",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "whatcrmviper",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "camilodev1993",
  logging: false
};
