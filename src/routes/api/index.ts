import { Router } from 'express'
import userRoutes from './user-routes'
import sessionRoutes from './session-routes'
import interestRoutes from './interest-routes'

const router = Router()

router.use('/users', userRoutes)
router.use('/sessions', sessionRoutes)
router.use('/interests', interestRoutes)

export default router