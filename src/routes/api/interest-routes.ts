import { Router } from 'express';
import requireUser from '../../middleware/requireUser';
import validateResource from '../../middleware/validateResource';
// import handlers
// import requireUser
// import validate resource
// import schema

const router = Router()

// get all interests
router.route("/")
  .get(validateResource)
  // .post([requireUser, validateResource(createTopicSchema)])
  