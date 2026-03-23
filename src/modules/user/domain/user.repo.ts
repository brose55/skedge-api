import type { PublicUserDTO, NewUser, AuthResult } from "./user.dto";

export interface IUserRepository {
  createPublicUser(input: NewUser): Promise<PublicUserDTO>;
  authenticateUser(email: string, password: string): Promise<AuthResult>;
  findPublicById(id: string): Promise<PublicUserDTO | null>;
  findPublicWithPvById(
    id: string,
  ): Promise<{ user: PublicUserDTO; passwordVersion: number } | null>;
}
