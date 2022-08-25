import config from 'config'
import connection from './utils/connection'
import logger from './utils/logger'
import createServer from './utils/server'


const port = config.get<number>('port')

const app = createServer()

app.listen(port, async () => {
  logger.info(`app is running on http://localhost:${port}`)

  await connection();
})
