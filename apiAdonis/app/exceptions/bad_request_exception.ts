import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class BadRequestException extends Exception {
  public code = 'BAD_REQUEST'
  static status = 400

  public async handle(error: this, ctx: HttpContext) {
    return ctx.response.status(error.status).send({
      code: error.code,
      message: error.message,
      status: error.status,
    })
  }
}
