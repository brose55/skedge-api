import { z } from "zod";

const allowedPasswordChars = /^[A-Za-z0-9!@#$%^&+=]*$/;

const passwordValidator = z
  .string()
  .min(10, { message: "Password must be at least 10 characters long" }) // Minimum length
  .max(64, { message: "Password must be no more than 64 characters long" }) // Maximum length
  .regex(allowedPasswordChars, {
    message: "Password contains invalid characters",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "Password must include at least one number",
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password must include at least one uppercase letter",
  })
  .refine((value) => /[a-z]/.test(value), {
    message: "Password must include at least one lowercase letter",
  })
  .refine((value) => /[!@#$%^&+=]/.test(value), {
    message: "Password must include at least one special character",
  });

export default passwordValidator;
