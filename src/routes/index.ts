import { Router } from "express";
import homeRoutes from "./home-routes";
import apiRoutes from './api'
// import dashboardRoutes from './dashboard-routes'

const router = Router()

router.use('/', homeRoutes);
// router.use('/dashboard', dashboardRoutes);
router.use('/api', apiRoutes);

export default router;