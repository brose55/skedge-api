module.exports = {
  port: process.env.PORT || 3001,
  domain: "localhost",
  dbUri: process.env.DB_URI,
  saltWorkFactor: 10,
  accessTokenTtl: "15m",
  accessTokenCookieTtl: 900000,
  refreshTokenTtl: "1y",
  refreshTokenCookieTtl: 3.154e10,
  publicKey: process.env.PUBLIC_KEY,
  privateKey: process.env.PRIVATE_RSA_KEY,

  cookie: {
    topology: "same",
    domain: null,
    sameSite: "lax",
    secure: false,
    httpOnly: true,
  },
  cors: {
    origins: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  },
  jwt: {
    issuer: "skedge-api-dev",
    audience: "skedge-client-dev",
  },
};
