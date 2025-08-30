// Core DTOs (shared across layers)
export type PublicUserDTO = {
  _id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewUser = {
  username: string;
  email: string;
  password: string;
};

// Auth (internal detail for model/repo; controller shouldn't expose reasons)
export type AuthFailReason = "NO_USER" | "BAD_PASSWORD";

export type AuthResult =
  | { ok: true; user: PublicUserDTO; passwordVersion: number }
  | { ok: false; reason: AuthFailReason };
