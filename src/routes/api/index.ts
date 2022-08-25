import { Router } from 'express'
import userRoutes from './user-routes'
import sessionRoutes from './session-routes'
import productRoutes from './product-routes'

const router = Router()

router.use('/users', userRoutes)
router.use('/sessions', sessionRoutes)
router.use('/products', productRoutes)

export default router