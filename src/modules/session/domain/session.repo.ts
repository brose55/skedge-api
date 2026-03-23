import type { PublicSessionDTO, NewSession } from "./session.dto";

export interface ISessionRepository {
  createSession(input: NewSession): Promise<PublicSessionDTO>;
  findSessionsByUser(
    userId: string,
    opts?: { limit?: number },
  ): Promise<PublicSessionDTO[]>;
  invalidateSession(sessionId: string): Promise<void>;
}
