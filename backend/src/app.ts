import express, { Application } from 'express'
import cors from 'cors'
import compression from 'compression'
import 'express-async-errors'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { httpLogger } from './middleware/logger'
import { systemRouter } from './modules/system'
// Mock API (无需数据库)
import mockRouter from './modules/mock-api'
import { ugcVideoRouter } from './modules/ugc-video'
import { aiVideoRouter } from './modules/ai-video'

export const createApp = (): Application => {
  const app = express()

  // HTTP request logging
  app.use(httpLogger)

  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN,
      credentials: env.CORS_ORIGIN !== '*',
    })
  )

  // Body parsing and compression (limit for image uploads)
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  app.use(compression())

  // API routes - System & Health
  app.use(env.API_PREFIX, systemRouter)

  // Mock API routes (无需数据库)
  app.use(`${env.API_PREFIX}`, mockRouter)

  // Safe local FFmpeg export; no paid video API or uploaded executable is used.
  app.use(`${env.API_PREFIX}`, ugcVideoRouter)

  // Paid OpenAI video generation is guarded by a separate estimate, explicit authorization, and per-scene action.
  app.use(`${env.API_PREFIX}`, aiVideoRouter)

  // Error handling
  app.use(errorHandler)

  return app
}
