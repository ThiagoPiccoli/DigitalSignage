import { errors } from '@adonisjs/auth'
import { Exception } from '@adonisjs/core/exceptions'
import { ExceptionHandler, HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: Exception, ctx: HttpContext) {
    if (error instanceof errors.E_INVALID_CREDENTIALS) {
      console.log(error.getResponseMessage(error, ctx))
      return ctx.response.status(401).send({
        code: error.code || 'E_INVALID_CREDENTIALS',
        message: error.message,
        status: 401,
      })
    }
    if (error.status === 422) {
      return ctx.response.status(422).send({
        code: 'BAD_REQUEST',
        message: error.message,
        status: error.status,
        errors: (error as any).messages || {},
      })
    } else if (error.status === 404) {
      console.error('Not Found:', error)
      return ctx.response.status(404).send({
        code: 'NOT_FOUND',
        message: 'resource not found',
        status: error.status,
      })
    }
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
