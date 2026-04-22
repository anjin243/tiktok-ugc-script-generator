import express, { Application } from 'express'
import cors from 'cors'
import compression from 'compression'
import 'express-async-errors'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { httpLogger } from './middleware/logger'
import { systemRouter } from './modules/system'
// UGC Video Generator Modules
import productRouter from './modules/product'
import projectRouter from './modules/project'
import generateRouter from './modules/generate'
import recognizeRouter from './modules/recognize'
import settingsRouter from './modules/settings'

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

  // UGC Video Generator API routes
  app.use(`${env.API_PREFIX}/products`, productRouter)
  app.use(`${env.API_PREFIX}/projects`, projectRouter)
  app.use(`${env.API_PREFIX}/generate`, generateRouter)
  app.use(`${env.API_PREFIX}/recognize`, recognizeRouter)
  app.use(`${env.API_PREFIX}/settings`, settingsRouter)

  // Error handling
  app.use(errorHandler)

  return app
}
