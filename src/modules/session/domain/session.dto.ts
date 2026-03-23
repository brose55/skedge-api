export const PUBLIC_SESSION_PROJECTION =
  "_id userId userAgent valid createdAt updatedAt" as const;

export type PublicSessionDTO = {
  _id: string;
  userId: string;
  userAgent?: string;
  valid: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type NewSession = {
  userId: string;
  userAgent?: string;
};
