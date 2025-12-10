import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export default class MediaService {
  private static get MEDIA_DIR() {
    return app.publicPath('media')
  }

  private static ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']
  private static ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg']
  private static ALLOWED_HTML_EXTENSIONS = ['html', 'htm']

  static async ensureMediaDir(): Promise<void> {
    try {
      await fs.access(this.MEDIA_DIR)
    } catch {
      await fs.mkdir(this.MEDIA_DIR, { recursive: true })
    }
  }

  static isAllowedExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase().slice(1)
    return [
      ...this.ALLOWED_IMAGE_EXTENSIONS,
      ...this.ALLOWED_VIDEO_EXTENSIONS,
      ...this.ALLOWED_HTML_EXTENSIONS,
    ].includes(ext)
  }

  static isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase().slice(1)
    return this.ALLOWED_IMAGE_EXTENSIONS.includes(ext)
  }

  static isVideoFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase().slice(1)
    return this.ALLOWED_VIDEO_EXTENSIONS.includes(ext)
  }

  static isHtmlFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase().slice(1)
    return this.ALLOWED_HTML_EXTENSIONS.includes(ext)
  }

  static sanitizeFilename(filename: string): string | null {
    if (typeof filename !== 'string') return null
    const base = path.basename(filename)
    if (!base || base === '.' || base === '..') return null
    if (base.includes('\0')) return null
    const ext = path.extname(base)
    const name = path.basename(base, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
    return `${name}${ext}`
  }

  static sanitizeUserHtml(input: string = ''): string {
    let out = String(input)
    out = out.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    out = out.replace(/\son\w+="[^"]*"/gi, '')
    out = out.replace(/\son\w+='[^']*'/gi, '')
    out = out.replace(/\son\w+=\S+/gi, '')
    return out
  }

  static generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
    return `${baseName}-${cuid()}${ext}`
  }

  static async uploadFile(file: MultipartFile, customFilename?: string): Promise<string> {
    await this.ensureMediaDir()
    const filename = customFilename || this.generateUniqueFilename(file.clientName)

    await file.move(this.MEDIA_DIR, {
      name: filename,
      overwrite: true,
    })

    if (file.state !== 'moved') {
      throw new Error(`Failed to upload file: ${file.errors.map((e) => e.message).join(', ')}`)
    }

    return filename
  }

  static async deleteFile(filename: string): Promise<void> {
    const sanitized = this.sanitizeFilename(filename)
    if (!sanitized) throw new Error('Invalid filename')

    const filePath = path.join(this.MEDIA_DIR, sanitized)
    const resolvedPath = path.resolve(filePath)

    if (!resolvedPath.startsWith(path.resolve(this.MEDIA_DIR))) {
      throw new Error('Path traversal detected')
    }

    await fs.unlink(resolvedPath)
  }

  static async listMediaFiles(): Promise<string[]> {
    await this.ensureMediaDir()
    const files = await fs.readdir(this.MEDIA_DIR)
    return files
      .filter((f) => f !== 'media.json' && this.isAllowedExtension(f))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }

  static async fileExists(filename: string): Promise<boolean> {
    const sanitized = this.sanitizeFilename(filename)
    if (!sanitized) return false
    const filePath = path.join(this.MEDIA_DIR, sanitized)
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  static async readFile(filename: string): Promise<string> {
    const sanitized = this.sanitizeFilename(filename)
    if (!sanitized) throw new Error('Invalid filename')
    const filePath = path.join(this.MEDIA_DIR, sanitized)
    return await fs.readFile(filePath, 'utf8')
  }

  static async writeFile(filename: string, content: string): Promise<void> {
    await this.ensureMediaDir()
    const sanitized = this.sanitizeFilename(filename)
    if (!sanitized) throw new Error('Invalid filename')
    const filePath = path.join(this.MEDIA_DIR, sanitized)
    await fs.writeFile(filePath, content, 'utf8')
  }

  static async copyFile(src: string, dest: string): Promise<void> {
    const srcSanitized = this.sanitizeFilename(src)
    const destSanitized = this.sanitizeFilename(dest)
    if (!srcSanitized || !destSanitized) throw new Error('Invalid filename')

    const srcPath = path.join(this.MEDIA_DIR, srcSanitized)
    const destPath = path.join(this.MEDIA_DIR, destSanitized)
    await fs.copyFile(srcPath, destPath)
  }

  static getFileUrl(filename: string): string {
    return `/media/${filename}`
  }
}
