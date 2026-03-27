import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export default class MediaService {
  private static get MEDIA_DIR() {
    return process.env.MEDIA_PATH || app.publicPath('media')
  }

  private static ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']
  private static ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov']
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
    // Remove script tags (including self-closing and malformed)
    out = out.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    out = out.replace(/<script[\s\S]*?\/?>/gi, '')
    // Remove other dangerous tags
    out = out.replace(/<\/?(?:iframe|object|embed|form|link|meta|base)[\s\S]*?\/?>/gi, '')
    // Remove all on* event handler attributes (quoted, unquoted, backtick)
    out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    out = out.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    out = out.replace(/\son\w+\s*=\s*`[^`]*`/gi, '')
    out = out.replace(/\son\w+\s*=\s*[^\s>"']+/gi, '')
    // Remove javascript: and data: URIs in href/src/action attributes
    out = out.replace(/(href|src|action)\s*=\s*"javascript\s*:[^"]*"/gi, '$1=""')
    out = out.replace(/(href|src|action)\s*=\s*'javascript\s*:[^']*'/gi, "$1=''")
    out = out.replace(/(href|src|action)\s*=\s*javascript\s*:[^\s>]*/gi, '$1=""')
    out = out.replace(/(href|src|action)\s*=\s*"data\s*:[^"]*"/gi, '$1=""')
    out = out.replace(/(href|src|action)\s*=\s*'data\s*:[^']*'/gi, "$1=''")
    out = out.replace(/(href|src|action)\s*=\s*data\s*:[^\s>]*/gi, '$1=""')
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
    const resolvedPath = this.safeResolvePath(sanitized)
    await fs.unlink(resolvedPath)
  }

  /**
   * Resolve a filename inside MEDIA_DIR and guard against path traversal.
   */
  private static safeResolvePath(sanitizedFilename: string): string {
    const filePath = path.join(this.MEDIA_DIR, sanitizedFilename)
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(path.resolve(this.MEDIA_DIR))) {
      throw new Error('Path traversal detected')
    }
    return resolvedPath
  }

  /**
   * Publicly resolve a sanitized filename to its full path inside MEDIA_DIR.
   * Returns null if the filename is invalid.
   */
  static resolveFilePath(filename: string): string | null {
    const sanitized = this.sanitizeFilename(filename)
    if (!sanitized) return null
    try {
      return this.safeResolvePath(sanitized)
    } catch {
      return null
    }
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
    const resolvedPath = this.safeResolvePath(sanitized)
    try {
      await fs.access(resolvedPath)
      return true
    } catch {
      return false
    }
  }

  static async readFile(filename: string): Promise<string> {
    const sanitized = this.sanitizeFilename(filename)
    if (!sanitized) throw new Error('Invalid filename')
    const resolvedPath = this.safeResolvePath(sanitized)
    return await fs.readFile(resolvedPath, 'utf8')
  }

  static async writeFile(filename: string, content: string): Promise<void> {
    await this.ensureMediaDir()
    const sanitized = this.sanitizeFilename(filename)
    if (!sanitized) throw new Error('Invalid filename')
    const resolvedPath = this.safeResolvePath(sanitized)
    await fs.writeFile(resolvedPath, content, 'utf8')
  }

  static async copyFile(src: string, dest: string): Promise<void> {
    const srcSanitized = this.sanitizeFilename(src)
    const destSanitized = this.sanitizeFilename(dest)
    if (!srcSanitized || !destSanitized) throw new Error('Invalid filename')

    const srcPath = this.safeResolvePath(srcSanitized)
    const destPath = this.safeResolvePath(destSanitized)
    await fs.copyFile(srcPath, destPath)
  }

  static getFileUrl(filename: string): string {
    return `/media/${filename}`
  }
}
