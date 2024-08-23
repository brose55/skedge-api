import { get } from "lodash";
import { FilterQuery, UpdateQuery } from "mongoose";
import ISessionModel from "../interfaces/ISessionModel";
import SessionModel from "../models/SessionModel";
import { signJwt, verifyJwt } from "../utils/jwt";
import { findUser } from "./UserService";
import config from 'config';
// import logger from "../utils/logger";

export async function createSession(userId: string, userAgent: string) {
  const session = await SessionModel.create({ user: userId, userAgent })
  return session.toJSON()   
  // try {
  // } catch (err) {
  //   logger.error(err)
  // }
}

export async function findSessions(query: FilterQuery<ISessionModel>) {
  return SessionModel.find(query).lean()  
}

export async function updateSession(query: FilterQuery<ISessionModel>, update: UpdateQuery<ISessionModel>) {
  return SessionModel.updateOne(query, update)
}

export async function reissueAccessToken({refreshToken}: {refreshToken: string}) {
  const { decoded } = verifyJwt(refreshToken)

  if (!decoded || !get(decoded, 'session')) {
    return false
  }

  const session = await SessionModel.findById(get(decoded, 'session'))

  if (!session || !session.valid) {
    return false
  }

  const user = await findUser({_id: session.user})

  if (!user) {
    return false
  }

  const accessToken = signJwt(
		{...user, session: session._id },
		{ expiresIn: config .get("accessTokenTtl") }
	);

  return accessToken
}