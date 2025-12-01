import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import BadRequestException from '#exceptions/bad_request_exception'
import { createUserValidator, updateUserValidator } from '#validators/create_user'

export default class UsersController {
  public async store({ request, response }: HttpContext) {
    const userPayload = await request.validateUsing(createUserValidator)

    const { email, password, username, isAdmin } = userPayload

    const userByEmail = await User.findBy('email', email)
    if (userByEmail) {
      throw new BadRequestException('email already in use', { status: 409 })
    }

    const userByUsername = await User.findBy('username', username)
    if (userByUsername) {
      throw new BadRequestException('username already in use', { status: 409 })
    }

    const user = await User.create({
      email,
      password,
      username,
      isAdmin: isAdmin ?? false,
    })

    return response.created({ user })
  }

  public async update({ request, response, params, bouncer }: HttpContext) {
    const { email, username, password } = await request.validateUsing(updateUserValidator)
    const user = await User.findOrFail(params.id)
    await bouncer.authorize('updateUser', user)

    if (email !== undefined) user.email = email
    if (username !== undefined) user.username = username
    if (password !== undefined) user.password = password

    await user.save()
    return response.ok({ user })
  }

  public async index({ response }: HttpContext) {
    const users = await User.all()
    return response.ok({ users })
  }

  public async show({ response, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return response.ok({ user })
  }

  public async destroy({ response, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.noContent()
  }
}
