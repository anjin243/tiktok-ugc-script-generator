import { createApp } from './app'
import { env } from './config/env'
import { logger } from './config/logger'

// The local launcher supplies the API key and proxy only to this backend process.
const startServer = async () => {
  try {
    const app = createApp()

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}${env.API_PREFIX}`)
      console.log('Using mock API (no database required)')
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server')
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))

startServer()
