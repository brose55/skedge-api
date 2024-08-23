import { Router } from 'express';
import {
  getInterestsHandler,
  createInterestsHandler,
  deleteInterestHandler
} from '../../controllers/InterestController'
import requireUser from '../../middleware/requireUser';
import validateResource from '../../middleware/validateResource';
// import schema
import {
  // createInterestSchema,
  deleteInterestSchema,
  createInterestsSchema,
  // getInterestsSchema
} from '../../schemas/InterestSchema'

const router = Router()

// get all interests
router
  .route("/")
  .get(
    requireUser,
    getInterestsHandler
  )
  .put(
    [requireUser, validateResource(createInterestsSchema)],
    createInterestsHandler
  )

router
  .route('/:interestId')
  .delete(
    [requireUser, validateResource(deleteInterestSchema)],
    deleteInterestHandler
  )
  

export default router