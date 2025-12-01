import { apiClient } from '@japa/api-client'
import { assert } from '@japa/assert'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'

import type { Config } from '@japa/runner/types'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Run migrations
 */
async function runMigrations() {
  await testUtils.db().migrate()
}

/**
 * Rollback migrations
 */
async function rollbackMigrations() {
  await testUtils.db().truncate()
}

export const plugins: Config['plugins'] = [assert(), pluginAdonisJS(app), apiClient()]

export const runnerHooks: Pick<Config, 'setup' | 'teardown'> = {
  setup: [runMigrations],
  teardown: [rollbackMigrations],
}

export const reporters: Config['reporters'] = {
  activated: ['spec'],
}
