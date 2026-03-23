import SessionModel from "./session.model";
import type { ISessionRepository } from "../domain/session.repo";
import {
  PUBLIC_SESSION_PROJECTION,
  type PublicSessionDTO,
  type NewSession,
} from "../domain/session.dto";

export const sessionRepository: ISessionRepository = {
  async createSession(input: NewSession): Promise<PublicSessionDTO> {
    const doc = await SessionModel.create(input);
    return doc.toJSON() as PublicSessionDTO;
  },

  async findSessionsByUser(userId, opts): Promise<PublicSessionDTO[]> {
    return SessionModel.find({ userId, valid: true })
      .select(PUBLIC_SESSION_PROJECTION)
      .sort({ createdAt: -1 })
      .limit(opts?.limit ?? 50)
      .lean<PublicSessionDTO[]>()
      .exec();
  },

  async invalidateSession(sessionId): Promise<void> {
    await SessionModel.updateOne({ _id: sessionId }, { valid: false });
  },
};
