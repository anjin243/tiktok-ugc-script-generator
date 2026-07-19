import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import express from 'express'
import request from 'supertest'
import fixture from './fixtures/outdoor-fishing-hat.json'
import { ugcVideoRouter } from '../modules/ugc-video'
import {
  captureVideoFrame,
  checkCommand,
  probeMedia,
  renderVideo,
  runProcess,
  writeAssSubtitles,
} from '../services/ffmpeg-video'
import {
  createProductSlug,
  generateMalaysiaUgcScript,
  ugcProductInputSchema,
} from '../services/ugc-malaysia-script'

const repoRoot = path.resolve(process.cwd(), '..')
const outputDirectory = path.join(repoRoot, 'output')

describe('TikTok Malaysia basic UGC export', () => {
  const input = ugcProductInputSchema.parse(fixture)
  const app = express().use('/api', ugcVideoRouter)

  it('creates a compliant 15 second Skill-compatible storyboard', () => {
    const script = generateMalaysiaUgcScript(input, 4)
    expect(script.scenes).toHaveLength(4)
    expect(script.scenes.reduce((total, scene) => total + scene.duration, 0)).toBe(15)
    expect(script.malayVoiceover).toContain('Boleh dilipat')
    expect(script.risks.join(' ')).toContain('UPF')
    expect(script.risks.join(' ')).toContain('kalis air')
    expect(script.risks.join(' ')).toContain('Kebenaran jenama')
    expect(JSON.stringify(script.scenes)).not.toMatch(/UPF50\+|kalis air sepenuhnya/i)
  })

  it('rejects too few images and executable upload content', async () => {
    const metadata = JSON.stringify(input)
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    await request(app)
      .post('/api/ugc-video/tasks')
      .field('metadata', metadata)
      .attach('images', pngHeader, { filename: 'one.png', contentType: 'image/png' })
      .attach('images', pngHeader, { filename: 'two.png', contentType: 'image/png' })
      .expect(400)

    const executableHeader = Buffer.from('MZ-not-an-image')
    await request(app)
      .post('/api/ugc-video/tasks')
      .field('metadata', metadata)
      .attach('images', executableHeader, { filename: 'one.exe', contentType: 'application/octet-stream' })
      .attach('images', executableHeader, { filename: 'two.exe', contentType: 'application/octet-stream' })
      .attach('images', executableHeader, { filename: 'three.exe', contentType: 'application/octet-stream' })
      .expect(400)
  })

  it('renders and probes a real 1080x1920 H.264 MP4', async () => {
    expect(await checkCommand('ffmpeg')).toBe(true)
    expect(await checkCommand('ffprobe')).toBe(true)

    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'ugc-video-test-'))
    await fs.mkdir(outputDirectory, { recursive: true })
    const images: string[] = []

    try {
      for (let index = 0; index < 4; index += 1) {
        const imagePath = path.join(tempDirectory, `hat-${index + 1}.png`)
        await runProcess(process.env.FFMPEG_PATH || 'ffmpeg', [
          '-hide_banner', '-loglevel', 'error',
          '-f', 'lavfi', '-i', 'testsrc2=s=1080x1920:r=1:d=0.1',
          '-vf', `hue=h=${index * 55}`,
          '-frames:v', '1', '-y', imagePath,
        ], 30_000)
        images.push(imagePath)
      }

      const script = generateMalaysiaUgcScript(input, images.length)
      const subtitlePath = path.join(tempDirectory, 'captions.ass')
      await writeAssSubtitles(subtitlePath, script.scenes, 'bilingual')
      const slug = createProductSlug(input.productName)
      const outputPath = path.join(outputDirectory, `${slug}-ugc-my.mp4`)
      const screenshotPath = path.join(outputDirectory, `${slug}-ugc-my-preview.jpg`)

      await renderVideo({
        images,
        scenes: script.scenes,
        subtitleMode: 'bilingual',
        subtitlePath,
        outputPath,
      })
      await captureVideoFrame(outputPath, screenshotPath)
      const motionFrameA = path.join(tempDirectory, 'motion-a.png')
      const motionFrameB = path.join(tempDirectory, 'motion-b.png')
      await captureVideoFrame(outputPath, motionFrameA, 4.2)
      await captureVideoFrame(outputPath, motionFrameB, 5.2)

      const probe = await probeMedia(outputPath)
      expect(probe.width).toBe(1080)
      expect(probe.height).toBe(1920)
      expect(probe.codec).toBe('h264')
      expect(probe.duration).toBeGreaterThanOrEqual(14.9)
      expect(probe.duration).toBeLessThanOrEqual(15.1)
      expect((await fs.stat(outputPath)).size).toBeGreaterThan(10_000)
      expect((await fs.stat(screenshotPath)).size).toBeGreaterThan(1_000)
      expect((await fs.readFile(motionFrameA)).equals(await fs.readFile(motionFrameB))).toBe(false)
    } finally {
      await fs.rm(tempDirectory, { recursive: true, force: true })
    }
  }, 300_000)
})
