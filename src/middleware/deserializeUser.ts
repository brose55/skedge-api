import { Request, Response, NextFunction } from "express";
import { get } from "lodash";
import config from 'config';
import { reissueAccessToken } from "../services/SessionService";
import { verifyJwt } from "../utils/jwt";

const deserializeUser = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = 
    get(req, 'cookies.accessToken') || 
    get(req, 'headers.authorization', '').replace(/^Bearer\s/, '')

  const refreshToken = 
    get(req, 'cookies.refreshToken')
    get(req, 'headers.x-refresh')

  if (!accessToken) {
    return next()
  }
  const {decoded, expired} = verifyJwt(accessToken)
  
  if (decoded) {
    res.locals.user = decoded
    return next()
  }

  if (expired && refreshToken) {
    
    const newAccessToken = await reissueAccessToken({refreshToken})
    
    if (newAccessToken) {
      res.setHeader('x-access-token', newAccessToken)
      res.cookie("accessToken", newAccessToken, {
        maxAge: config.get("accessTokenCookieTtl"),
        httpOnly: true,
        domain: config.get("domain"),
        path: "/",
        sameSite: "strict",
        // TODO: set to true in production
        secure: false,
      });
      const result = verifyJwt(newAccessToken)
      res.locals.user = result.decoded
      return next()
    }

    return next()
  }

  return next()
}

export default deserializeUser