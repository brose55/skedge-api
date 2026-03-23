import { sessionRepository } from "../infra/session.repo.mongo";
import { userRepository } from "../../user/infra/user.repo.mongo";
import { makeSessionService } from "./session.service";

export const sessionService = makeSessionService({
  sessions: sessionRepository,
  users: userRepository,
});
