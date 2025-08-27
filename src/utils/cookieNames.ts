// @/utils/cookieNames.ts
import config from "config";

export function cookieNames() {
  const host =
    config.has("cookie.hostPrefix") &&
    !!config.get<boolean>("cookie.hostPrefix");
  const p = host ? "__Host-" : "";
  return { access: `${p}accessToken`, refresh: `${p}refreshToken` };
}
