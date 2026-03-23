import { userRepository } from "../infra/user.repo.mongo";
import { makeUserService } from "./user.service";

export const userService = makeUserService(userRepository);
