import { Router, Request, Response } from 'express'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  if (req) {
    res.send('Home')
  }
})

export default router;