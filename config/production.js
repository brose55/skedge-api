module.exports = {
  cors: {
    origins: ["https://skedgeio.netlify.app"],
    credentials: true,
  },

  cookie: {
    topology: "cross",
    domain: null,
    sameSite: "none",
    secure: true,
    httpOnly: true,
  },

  jwt: {
    issuer: "skedge-api",
    audience: "skedge-client",
  },
};
