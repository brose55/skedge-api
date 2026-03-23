import type { IUserRepository } from "../domain/user.repo";
import type { PublicUserDTO, NewUser } from "../domain/user.dto";
import logger from "@/utils/logger";

export function makeUserService(repo: IUserRepository) {
  return {
    async createUser(input: NewUser): Promise<PublicUserDTO> {
      return repo.createPublicUser(input);
    },

    async validatePassword(params: {
      email: string;
      password: string;
    }): Promise<false | { user: PublicUserDTO; passwordVersion: number }> {
      const outcome = await repo.authenticateUser(
        params.email,
        params.password,
      );

      if (!outcome.ok) {
        logger.info(
          {
            at: "auth.validatePassword",
            email: params.email,
            reason: outcome.reason,
          },
          "Password validation failed",
        );
        return false;
      }

      logger.debug(
        { at: "auth.validatePassword", userId: outcome.user._id },
        "Password validation succeeded",
      );

      return { user: outcome.user, passwordVersion: outcome.passwordVersion };
    },
  };
}
