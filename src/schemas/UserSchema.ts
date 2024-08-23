import { object, string, TypeOf } from "zod";

export const createUserSchema = object({
  body: object({
    username:string({required_error: 'username is required'}),
    password:string(
      {required_error: 'password is required'}
    ).min(8, 'password must be at least 8 characters'),
    passwordConfirmation: string({required_error: 'passwordConfirmation is required'}),
    email:string(
      {required_error: 'email is required'}
    ).email('Not a valid email'),
  }).refine(data => data.password === data.passwordConfirmation, {
    message: 'passwords do not match',
    path: ['passwordConfirmation']
  })
})

export type CreateUserInput = Omit<
  TypeOf<typeof createUserSchema>,
  'body.passwordConfirmation'
>