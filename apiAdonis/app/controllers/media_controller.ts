import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import MediaService from '#services/media_service'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

const MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
}

export default class MediaController {
  public async show({ params, response }: HttpContext) {
    const decodedFilename = decodeURIComponent(String(params.filename || ''))
    const filename = MediaService.sanitizeFilename(decodedFilename)

    if (!filename) {
      return response.badRequest({ error: 'Invalid filename' })
    }

    const mediaPath = MediaService.resolveFilePath(filename)
    const candidatePaths = [
      ...(mediaPath ? [mediaPath] : []),
      app.publicPath(path.join('media', filename)),
      path.resolve(process.cwd(), 'public', 'media', filename),
      path.resolve(process.cwd(), 'apiAdonis', 'public', 'media', filename),
    ]

    let filePath: string | null = null

    for (const candidate of candidatePaths) {
      try {
        await fs.access(candidate)
        filePath = candidate
        break
      } catch {
        // Try next candidate
      }
    }

    if (!filePath) {
      return response.notFound({ error: 'File not found' })
    }

    try {
      const content = await fs.readFile(filePath)
      const extension = path.extname(filename).toLowerCase()

      response.header('Cache-Control', 'public, max-age=300')
      response.type(MIME_BY_EXTENSION[extension] || 'application/octet-stream')
      return response.send(content)
    } catch {
      return response.notFound({ error: 'File not found' })
    }
  }
}
