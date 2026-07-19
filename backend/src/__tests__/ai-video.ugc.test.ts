import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import express from 'express'
import request from 'supertest'
import { createAiVideoRouter } from '../modules/ai-video'
import {
  OpenAiVideoClient,
  type CreateOpenAiVideoRequest,
  type OpenAiVideoClientContract,
} from '../services/openai-video-client'
import type { OpenAiVideoJob } from '../types/ai-video.types'

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nLkAAAAASUVORK5CYII=',
  'base64'
)

const baseInput = {
  productName: 'Large Portable Sports Water Bottle',
  sellingPoints: ['integrated carrying handle', 'portable strap', 'multiple colors'],
  targetMarket: 'Malaysia',
  modelDescription: 'fictional Malaysian woman aged 25 to 35 wearing modest casual sportswear',
  usageScene: 'bright outdoor badminton court and everyday gym setting',
  videoStyle: 'photorealistic handheld TikTok UGC',
  immutableDetails: ['black-to-clear gradient bottle body', 'single built-in handle', 'one black strap', 'one lid'],
  videoLanguage: 'Malay',
  subtitleMode: 'bilingual',
  model: 'sora-2',
  size: '720x1280',
  clipSeconds: 4,
  sceneCount: 4,
} as const

class FakeVideoClient implements OpenAiVideoClientContract {
  createCalls: CreateOpenAiVideoRequest[] = []

  async createVideo(input: CreateOpenAiVideoRequest): Promise<OpenAiVideoJob> {
    this.createCalls.push(input)
    return { id: `video_mock_${this.createCalls.length}`, status: 'queued', progress: 0 }
  }

  async retrieveVideo(videoId: string): Promise<OpenAiVideoJob> {
    return { id: videoId, status: 'completed', progress: 100 }
  }

  async downloadVideo(): Promise<Buffer> {
    return Buffer.from('mock-video-bytes')
  }
}

const createTask = (app: express.Application) => request(app)
  .post('/api/ai-video/tasks')
  .field('metadata', JSON.stringify(baseInput))
  .attach('images', onePixelPng, { filename: 'product.png', contentType: 'image/png' })

describe('AI human video paid-call guard and task flow', () => {
  let storageRoot: string

  beforeEach(async () => {
    storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-video-test-'))
  })

  afterEach(async () => {
    await fs.rm(storageRoot, { recursive: true, force: true })
  })

  it('estimates current Sora pricing without calling a video API', async () => {
    const fakeClient = new FakeVideoClient()
    const app = express().use(express.json()).use('/api', createAiVideoRouter({
      client: fakeClient,
      apiKeyConfigured: () => false,
      storageRoot,
    }))

    const standard = await request(app).post('/api/ai-video/estimate').send(baseInput).expect(200)
    expect(standard.body.data.callCount).toBe(4)
    expect(standard.body.data.totalBillableSeconds).toBe(16)
    expect(standard.body.data.estimatedTotalUsd).toBe(1.6)

    const pro = await request(app).post('/api/ai-video/estimate').send({
      ...baseInput,
      model: 'sora-2-pro',
      size: '1024x1792',
    }).expect(200)
    expect(pro.body.data.estimatedTotalUsd).toBe(8)
    expect(fakeClient.createCalls).toHaveLength(0)
  })

  it('formats the official create-video request against a mocked transport', async () => {
    const transport = jest.fn(async () => new Response(JSON.stringify({
      id: 'video_contract_test',
      status: 'queued',
      progress: 0,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as unknown as jest.MockedFunction<typeof fetch>
    const client = new OpenAiVideoClient(transport, () => 'test-only-key')

    await client.createVideo({
      model: 'sora-2',
      prompt: 'A fictional adult model picks up the referenced product.',
      seconds: 4,
      size: '720x1280',
      inputReferenceDataUrl: 'data:image/png;base64,AAAA',
    })

    expect(transport).toHaveBeenCalledTimes(1)
    const [url, init] = transport.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/videos')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer test-only-key',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(String(init?.body))).toEqual({
      model: 'sora-2',
      prompt: 'A fictional adult model picks up the referenced product.',
      seconds: '4',
      size: '720x1280',
      input_reference: { image_url: 'data:image/png;base64,AAAA' },
    })
  })

  it('creates a draft but blocks authorization when the backend key is absent', async () => {
    const fakeClient = new FakeVideoClient()
    const app = express().use(express.json()).use('/api', createAiVideoRouter({
      client: fakeClient,
      apiKeyConfigured: () => false,
      storageRoot,
    }))
    const created = await createTask(app).expect(201)
    expect(created.body.data.status).toBe('draft')
    expect(created.body.data.scenes).toHaveLength(4)
    expect(fakeClient.createCalls).toHaveLength(0)

    await request(app)
      .post(`/api/ai-video/tasks/${created.body.data.id}/authorize-cost`)
      .send({ confirmed: true, confirmationPhrase: '确认付费生成', acceptedEstimatedCostUsd: 1.6 })
      .expect(409)
    expect(fakeClient.createCalls).toHaveLength(0)
  })

  it('requires exact authorization, generates one scene once, and waits for review', async () => {
    const fakeClient = new FakeVideoClient()
    const app = express().use(express.json()).use('/api', createAiVideoRouter({
      client: fakeClient,
      apiKeyConfigured: () => true,
      storageRoot,
      pollIntervalMs: 0,
      maxPollAttempts: 2,
    }))
    const created = await createTask(app).expect(201)
    const taskId = created.body.data.id as string

    await request(app)
      .post(`/api/ai-video/tasks/${taskId}/authorize-cost`)
      .send({ confirmed: true, confirmationPhrase: 'wrong phrase', acceptedEstimatedCostUsd: 1.6 })
      .expect(400)
    expect(fakeClient.createCalls).toHaveLength(0)

    await request(app)
      .post(`/api/ai-video/tasks/${taskId}/authorize-cost`)
      .send({ confirmed: true, confirmationPhrase: '确认付费生成', acceptedEstimatedCostUsd: 1.6 })
      .expect(200)
    expect(fakeClient.createCalls).toHaveLength(0)

    await request(app).post(`/api/ai-video/tasks/${taskId}/scenes/1/generate`).expect(202)
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const current = await request(app).get(`/api/ai-video/tasks/${taskId}`).expect(200)
      if (current.body.data.scenes[0].status === 'awaiting_review') break
      await new Promise(resolve => setTimeout(resolve, 5))
    }
    const ready = await request(app).get(`/api/ai-video/tasks/${taskId}`).expect(200)
    expect(ready.body.data.scenes[0].status).toBe('awaiting_review')
    expect(fakeClient.createCalls).toHaveLength(1)
    expect(fakeClient.createCalls[0].model).toBe('sora-2')
    expect(fakeClient.createCalls[0].inputReferenceDataUrl).toMatch(/^data:image\/png;base64,/)

    await request(app).post(`/api/ai-video/tasks/${taskId}/scenes/1/generate`).expect(409)
    expect(fakeClient.createCalls).toHaveLength(1)

    await request(app)
      .post(`/api/ai-video/tasks/${taskId}/scenes/1/review`)
      .send({
        approved: true,
        review: {
          productColorCorrect: true,
          structureCorrect: true,
          logoAcceptable: true,
          quantityCorrect: true,
          accessoriesCorrect: true,
        },
      })
      .expect(200)

    await request(app).post(`/api/ai-video/tasks/${taskId}/cancel-future-scenes`).expect(200)
    await request(app).post(`/api/ai-video/tasks/${taskId}/scenes/2/generate`).expect(409)
    expect(fakeClient.createCalls).toHaveLength(1)
  })
})
