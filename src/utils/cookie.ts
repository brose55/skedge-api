import type { CookieOptions } from "express";
import config from "config";

type CookieCfg = {
  topology: "same" | "cross";
  domain?: string | null;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
  hostPrefix?: boolean;
};

const isDev = () => process.env.NODE_ENV !== "production";

export function getCookieOptions(): CookieOptions {
  const cfg = config.get<CookieCfg>("cookie");
  const base: CookieOptions = { httpOnly: cfg.httpOnly ?? true, path: "/" };

  // __Host- safety: no Domain, must be HTTPS (prod)
  if (cfg.hostPrefix) {
    if (cfg.domain) throw new Error("cookie.hostPrefix requires domain=null");
    if (isDev()) throw new Error("cookie.hostPrefix requires production HTTPS");
  }

  if (cfg.domain) base.domain = cfg.domain;

  if (cfg.topology === "cross") {
    return isDev()
      ? { ...base, sameSite: "lax", secure: false } // dev fallback
      : { ...base, sameSite: "none", secure: true };
  }

  return {
    ...base,
    sameSite: cfg.sameSite ?? "lax",
    secure: isDev() ? false : cfg.secure ?? true,
  };
}

export function getCookieNames() {
  const host =
    config.has("cookie.hostPrefix") &&
    !!config.get<boolean>("cookie.hostPrefix");
  const p = host ? "__Host-" : "";
  return { access: `${p}accessToken`, refresh: `${p}refreshToken` };
}
