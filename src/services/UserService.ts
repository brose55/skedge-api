// services/UserService.ts
import type { PublicUserDTO, NewUser } from "@/types/user.dto";
import { createPublicUser, authenticateUser } from "@/repos/users.repository";
import logger from "@/utils/logger";

/** Create user → return PublicUserDTO (no secrets ever leave this layer) */
export async function createUser(input: NewUser): Promise<PublicUserDTO> {
  // Future hooks: analytics, email verification, lockouts/rate limits, audits
  // — keep it out of controllers/models
  return createPublicUser(input);
}

/**
 * Validate credentials.
 * Returns:
 *  - false if invalid
 *  - { user, passwordVersion } if valid (for issuing JWT with pv)
 */
export async function validatePassword(params: {
  email: string;
  password: string;
}): Promise<false | { user: PublicUserDTO; passwordVersion: number }> {
  const outcome = await authenticateUser(params.email, params.password);

  if (!outcome.ok) {
    logger.info(
      {
        at: "auth.validatePassword",
        email: params.email,
        reason: outcome.reason,
      },
      "Password validation failed"
    );
    return false;
  }

  const { user, passwordVersion } = outcome;

  logger.debug(
    { at: "auth.validatePassword", userId: user._id },
    "Password validation succeeded"
  );

  return { user, passwordVersion };
}
