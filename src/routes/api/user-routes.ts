import { Router } from 'express'
import { createUserHandler, getCurrentUser } from '../../controllers/UserController';
import requireUser from '../../middleware/requireUser';
import validateResource from '../../middleware/validateResource';
import { createUserSchema } from '../../schemas/UserSchema';

const router = Router()

router.route('/')
  .post(validateResource(createUserSchema), createUserHandler)

router.route('/me')
  .get(requireUser, getCurrentUser)

export default router;