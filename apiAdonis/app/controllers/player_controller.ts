import type { HttpContext } from '@adonisjs/core/http'
import Player from '#models/player'
import MediaService from '../services/media_service.js'

export default class PlayerController {
  /**
   * Media upload endpoint (auto-detects type)
   */
  public async upload({ request, response, auth }: HttpContext) {
    const file = request.file('file', {
      size: '500mb',
      extnames: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'mp4', 'webm', 'ogg'],
    })

    if (!file) {
      return response.badRequest({ error: 'No file uploaded' })
    }

    if (!file.isValid) {
      return response.badRequest({ error: file.errors })
    }

    // Determine file type
    const isVideo = MediaService.isVideoFile(file.clientName)
    const fileType = isVideo ? 'video' : 'image'

    // Get optional metadata from request
    const title = request.input('title', file.clientName)
    const durationMs = isVideo ? 0 : request.input('durationMs', 10000)
    const schedule = request.input('schedule', {
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      start: '00:00',
      end: '23:59',
      tz: 'America/Sao_Paulo',
    })

    // Upload file to media directory
    const filename = await MediaService.uploadFile(file)
    const fileUrl = MediaService.getFileUrl(filename)

    // Create player record in database
    const player = await Player.create({
      fileType: fileType,
      title: title,
      fileUrl: fileUrl,
      durationMs: Number(durationMs),
      lastModified: auth.user?.id || 0,
      schedule: schedule,
    })

    return response.created({
      ok: true,
      file: filename,
      player: player,
    })
  }

  /**
   * Update player metadata
   */
  public async updateMedia({ request, response, params, auth }: HttpContext) {
    const player = await Player.findOrFail(params.id)

    const updateData = request.only(['title', 'durationMs', 'schedule'])

    // Update all fields at once
    player.merge({
      title: updateData.title ?? player.title,
      durationMs: updateData.durationMs ? Number(updateData.durationMs) : player.durationMs,
      lastModified: auth.user?.id || player.lastModified,
    })

    // Handle schedule separately if present
    if (updateData.schedule) {
      player.schedule = updateData.schedule
    }

    await player.save()
    return response.ok(player)
  }

  /**
   * Delete a player and its associated file
   */
  public async destroy({ response, params }: HttpContext) {
    const player = await Player.findOrFail(params.id)

    // Extract filename from URL and delete the file
    const filename = player.fileUrl.split('/').pop()
    if (filename) {
      try {
        await MediaService.deleteFile(filename)
      } catch (error) {
        console.warn(`Could not delete file ${filename}:`, error)
      }
    }

    await player.delete()
    return response.noContent()
  }

  /**
   * List all players
   */
  public async index({ response }: HttpContext) {
    const players = await Player.all()
    return response.ok(players)
  }

  /**
   * Get a single player
   */
  public async show({ response, params }: HttpContext) {
    const player = await Player.findOrFail(params.id)
    return response.ok(player)
  }
}
