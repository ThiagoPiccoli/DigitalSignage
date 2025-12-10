import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class SessionController {
  public async store({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user, [], { expiresIn: '2 hours' })
    return response.created({
      id: user.id,
      email: user.email,
      username: user.username,
      token: token.value!.release(),
    })
  }

  public async me({ auth, response }: HttpContext) {
    return response.ok({ user: auth.user || null })
  }

  public async destroy({ auth, response }: HttpContext) {
    const user = await auth.use('api').user!
    await User.accessTokens.delete(user, user.currentAccessToken!.identifier)
    return response.ok({ message: 'Successfully signed out' })
  }
}
