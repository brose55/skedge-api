import pino from 'pino'
import pretty from 'pino-pretty'
import dayjs from 'dayjs'

const stream = pretty({
  colorize: true,
  messageFormat: false,
  ignore: 'pid,hostname',
  customPrettifiers: {
    time: () => `[${dayjs().format('MM/DD/YYYY T HH:mm:ss')}]`  
  }
})

const logger = pino(stream)

// const logger = pino({
//   transport: {
//     target: 'pino-pretty',
//     options: {
//       colorize: true
//     }
//   },
//   base: {
//     pid: false
//   },
//   timestamp: () => `,"time":"${dayjs().format()}`
// })

export default logger;