import { object, string } from "zod";
import passwordValidator from "../utils/passwordValidator";

export const createSessionSchema = object({
  body: object({
    email: string().email("Not a valid email").min(1, "email is required"),
    password: passwordValidator,
  }),
});
