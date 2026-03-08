/*
 * @mixxtor/adonisjs-langchain
 *
 * (c) Mixxtor
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import type { LangchainManager } from '../src/langchain_manager.js'
import type { LangchainDrivers } from '../src/types/index.js'

/**
 * Pre-resolved LangchainManager singleton.
 *
 * @example
 * ```ts
 * import llm from '@mixxtor/adonisjs-langchain/services/main'
 *
 * // Default provider
 * await llm.invoke('Hello')
 *
 * // Specific provider with config overrides
 * await llm.use('anthropic', { temperature: 0.9 }).invoke('Hello')
 * ```
 */

let llm: LangchainManager<LangchainDrivers>

await app.booted(async () => {
  llm = await app.container.make('langchain')
})

export { llm as default }
