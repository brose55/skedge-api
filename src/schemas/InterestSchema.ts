import { object, array, string, number, TypeOf } from "zod";

const payload = {
  body: array(
    object({
      name: string({
        required_error: "interest name is required",
      }).max(20, "interest name must be less than 20 characters long"),
      priority: string({
        required_error: "interest priority level is required",
      }),
    })
  ),
};

const params = {
  params: object({
    interestId: string({
      required_error: "interestId is required",
    }),
  }),
};

export const createInterestsSchema = object({
  ...payload,
});

export const deleteInterestSchema = object({
  ...params,
});

export type CreateInterestsInput = TypeOf<typeof createInterestsSchema>;
export type DeleteInterestInput = TypeOf<typeof deleteInterestSchema>;
