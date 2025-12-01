import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class TokenExpiredException extends Exception {
  static message = 'Token expired'
  static status = 410
  static code = 'TOKEN_EXPIRED'

  constructor() {
    super('Token has expired')
  }

  public async handle(error: this, ctx: HttpContext) {
    return ctx.response.status(error.status).send({
      code: error.code,
      message: error.message,
      status: error.status,
    })
  }
}
