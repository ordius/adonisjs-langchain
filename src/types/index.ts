import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ConfigProvider } from '@adonisjs/core/types'

/**
 * Configuration entry for a chat model driver.
 *
 * - `Config` — the constructor config type (e.g. `ChatOpenAIFields`)
 * - `Client` — the actual class instance type (e.g. `ChatOpenAI`)
 */
export type ChatDriverConfig<
  Config = Record<string, any>,
  Client extends BaseChatModel = BaseChatModel,
> = {
  config: Config
  client: (config: Config) => Client
}

/**
 * Resolved langchain configuration shape.
 */
export type ResolvedLangchainConfig<
  Drivers extends Record<string, ChatDriverConfig<any, any>> = Record<string, ChatDriverConfig>,
> = {
  default: keyof Drivers & string
  drivers: Drivers
}

/**
 * Infer the drivers map from a `defineConfig()` return value.
 *
 * Used in the `declare module` augmentation so that `llm.use()`
 * auto-suggests only the driver names from your config.
 *
 * @example
 * ```ts
 * declare module '@ordius/adonisjs-langchain/types' {
 *   interface LangchainDrivers extends InferDrivers<typeof langchainConfig> {}
 * }
 * ```
 */
export type InferDrivers<T extends ConfigProvider<ResolvedLangchainConfig<any>>> = Awaited<
  ReturnType<T['resolver']>
>['drivers']

/**
 * Augmentable interface — **do not** add `extends Record<…>` here.
 *
 * When the user augments this via `declare module`, only the keys
 * from their config are valid. Adding an index signature would
 * make *any* string a valid driver name.
 */
export interface LangchainDrivers {}

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    langchain: import('../langchain_manager.js').LangchainManager<LangchainDrivers>
  }
}
