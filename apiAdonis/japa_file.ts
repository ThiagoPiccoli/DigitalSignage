import { execa } from 'execa'
import getPort from 'get-port'
import { configure, processCliArgs, run } from '@japa/runner'
import { join } from 'path'
import sourceMapSupport from 'source-map-support'
import 'reflect-metadata'

process.env.NODE_ENV = 'testing'
process.env.ADONIS_ACE_CWD = join(__dirname)
sourceMapSupport.install({ handleUncaughtExceptions: false })

async function runMigrations() {
  await execa('node', ['ace', 'migration:run'], {
    stdio: 'inherit',
  })
}

async function rollbackMigrations() {
  await execa('node', ['ace', 'migration:rollback', '--force'], {
    stdio: 'inherit',
  })
}

async function startHttpServer() {
  const { Ignitor } = await import('@adonisjs/core/build/src/Ignitor')
  process.env.PORT = String(await getPort())
  await new Ignitor(__dirname).httpServer().start()
}

/**
 * Configure test runner
 */
configure({
  files: ['test/**/*.spec.ts'],
  before: [runMigrations, startHttpServer],
  after: [rollbackMigrations],
})

processCliArgs(process.argv.slice(2))
run()
