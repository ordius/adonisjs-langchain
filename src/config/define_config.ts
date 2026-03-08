import { configProvider } from '@adonisjs/core'
import type { ConfigProvider } from '@adonisjs/core/types'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ChatDriverConfig, ResolvedLangchainConfig } from '../types/index.js'

/**
 * Driver factories for use inside `defineConfig()`.
 *
 * @example
 * ```ts
 * import { defineConfig, drivers } from '@mixxtor/adonisjs-langchain'
 * import { ChatOpenAI } from '@langchain/openai'
 *
 * defineConfig({
 *   default: 'openai',
 *   drivers: {
 *     openai: drivers.chat(ChatOpenAI, {
 *       model: 'gpt-4o-mini',   // ← autocomplete from ChatOpenAI constructor
 *       temperature: 0.7,
 *     }),
 *   },
 * })
 * ```
 */
export const drivers = {
  /**
   * Create a chat model driver entry.
   *
   * Config type and return type are both inferred from the class constructor,
   * giving full autocompletion on config and typed `use()` returns.
   */
  chat<Client extends new (config: any) => BaseChatModel>(
    Client: Client,
    config: NonNullable<ConstructorParameters<Client>[0]>
  ): ChatDriverConfig<NonNullable<ConstructorParameters<Client>[0]>, InstanceType<Client>> {
    return {
      config,
      client: (c) => new Client(c) as InstanceType<Client>,
    }
  },
}

/**
 * Define langchain configuration with full type inference.
 *
 * Returns a `ConfigProvider` resolved by the AdonisJS provider at boot time.
 */
export function defineConfig<Drivers extends Record<string, ChatDriverConfig<any, any>>>(
  config: ResolvedLangchainConfig<Drivers>
): ConfigProvider<ResolvedLangchainConfig<Drivers>> {
  return configProvider.create(async (_app) => config)
}
