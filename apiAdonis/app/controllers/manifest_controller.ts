import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export default class ManifestController {
  private static get MANIFEST_PATH() {
    return app.publicPath('media/media.json')
  }

  /**
   * Read manifest file
   */
  private async readManifest() {
    try {
      const content = await fs.readFile(ManifestController.MANIFEST_PATH, 'utf8')
      return JSON.parse(content)
    } catch {
      // Default manifest structure
      return {
        defaults: {
          imageDurationMs: 10000,
          htmlDurationMs: 15000,
          fitMode: 'fit',
          bgColor: '#000000',
          mute: true,
          volume: 1.0,
          schedule: {
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            start: '00:00',
            end: '23:59',
            tz: 'America/Sao_Paulo',
          },
        },
        overrides: [],
      }
    }
  }

  /**
   * Save manifest file
   */
  private async saveManifest(data: any) {
    const dir = path.dirname(ManifestController.MANIFEST_PATH)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(ManifestController.MANIFEST_PATH, JSON.stringify(data, null, 2), 'utf8')
  }

  /**
   * Set global defaults
   */
  public async setDefaults({ request, response }: HttpContext) {
    const manifest = await this.readManifest()
    const updates = request.only([
      'imageDurationMs',
      'htmlDurationMs',
      'fitMode',
      'bgColor',
      'mute',
      'volume',
      'schedule',
    ])

    manifest.defaults = { ...manifest.defaults, ...updates }
    await this.saveManifest(manifest)

    return response.ok({ ok: true, defaults: manifest.defaults })
  }

  /**
   * Set file-specific override
   */
  public async setOverride({ request, response }: HttpContext) {
    const manifest = await this.readManifest()
    const data = request.only([
      'src',
      'type',
      'fitMode',
      'imageDurationMs',
      'htmlDurationMs',
      'mute',
      'volume',
      'schedule',
    ])

    if (!data.src) {
      return response.badRequest({ error: 'src is required' })
    }

    const index = manifest.overrides.findIndex((o: any) => o.src === data.src)
    if (index >= 0) {
      manifest.overrides[index] = { ...manifest.overrides[index], ...data }
    } else {
      manifest.overrides.push(data)
    }

    await this.saveManifest(manifest)
    return response.ok({ ok: true })
  }

  /**
   * Delete file override
   */
  public async deleteOverride({ params, response }: HttpContext) {
    const manifest = await this.readManifest()
    manifest.overrides = manifest.overrides.filter((o: any) => o.src !== params.src)
    await this.saveManifest(manifest)
    return response.ok({ ok: true })
  }

  /**
   * Get manifest (public endpoint)
   */
  public async show({ response }: HttpContext) {
    const manifest = await this.readManifest()
    return response.ok(manifest)
  }
}
