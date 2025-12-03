import type { HttpContext } from '@adonisjs/core/http'
import Player from '#models/player'
import {
  createImageValidator,
  updatePlayerValidator,
  createHtmlValidator,
  createVideoValidator,
} from '#validators/player'

export default class PlayerController {
  public async upload({ request, response }: HttpContext) {
    const requestPayload = request.all()

    switch (requestPayload.fileType) {
      case 'html': {
        const htmlPayload = await request.validateUsing(createHtmlValidator)
        const html = await Player.create(htmlPayload)
        return response.created(html)
      }
      case 'image': {
        const playerPayload = await request.validateUsing(createImageValidator) // Separate validator
        const player = await Player.create(playerPayload)
        return response.created(player)
      }
      case 'video': {
        //Pedir para o Ruhan como fazer isso aqui
        const videoPayload = await request.validateUsing(createVideoValidator)
        const video = await Player.create(videoPayload)
        return response.created(video)
      }
      default:
        throw new Error('Unsupported file type')
    }
  }

  public async update({ request, response, params }: HttpContext) {
    console.log('Updating player with id:', params.id)
    const player = await Player.findOrFail(params.id)
    const playerPayload = await request.validateUsing(updatePlayerValidator)
    player.merge(playerPayload)
    await player.save()
    return response.ok(player)
  }

  public async destroy({ response, params }: HttpContext) {
    const player = await Player.findOrFail(params.id)
    console.log('Deleting player with id:', params.id)
    await player.delete()

    return response.noContent()
  }

  public async index({ response }: HttpContext) {
    const players = await Player.all()
    return response.ok(players)
  }

  public async show({ response, params }: HttpContext) {
    const player = await Player.findOrFail(params.id)
    return response.ok(player)
  }
}
