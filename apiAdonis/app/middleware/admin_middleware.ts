import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.use('api').user

    if (!user || !user.isAdmin) {
      return response.forbidden({ message: 'Access denied. Admin privileges required.' })
    }

    console.log('User is admin, proceeding')
    await next()
  }
}
