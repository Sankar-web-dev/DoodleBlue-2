import session from "express-session";
import MongoStore from "connect-mongo";

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  const mongoUrl = process.env.MONGODB_URI;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing");
  }

  if (!mongoUrl) {
    throw new Error("MONGODB_URI is missing");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const sameSite =
    process.env.SESSION_SAME_SITE === "none" ? "none" : "lax";

  if (sameSite === "none" && !isProduction) {
    throw new Error("SameSite=None requires HTTPS in this configuration");
  }

  return session({
    name: process.env.SESSION_COOKIE_NAME || "sms.sid",
    secret,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl,
      collectionName: "sessions",
      ttl: 60 * 60 * 24,
    }),

    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
}