export type Priority = "low" | "medium" | "high";

export const PUBLIC_INTEREST_PROJECTION =
  "_id userId name priority createdAt updatedAt" as const;

export type PublicInterestDTO = {
  _id: string;
  userId: string;
  name: string;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
};

export type NewInterest = {
  userId: string;
  name: string;
  priority: Priority;
};
