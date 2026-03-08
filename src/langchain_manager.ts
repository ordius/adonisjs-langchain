import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ChatDriverConfig } from './types/index.js'

/**
 * Manages multiple LLM drivers configured via `defineConfig`.
 *
 * - `use()` → default client (cached)
 * - `use(name)` / `use(name, overrides)` → named client (new instance)
 * - `config(name)` → read the resolved config for a driver
 * - `invoke()`, `stream()`, `batch()` → delegate to the default client
 */
export class LangchainManager<KnownDrivers> {
  #config: { default: keyof KnownDrivers & string; drivers: KnownDrivers }
  #defaultClient: BaseChatModel | null = null

  constructor(config: { default: keyof KnownDrivers & string; drivers: KnownDrivers }) {
    this.#config = config
  }

  /**
   * Get the default client (cached).
   */
  use(): BaseChatModel
  /**
   * Get a client for a named driver. Creates a new instance each call.
   *
   * Returns the actual class type (e.g. `ChatOpenAI`), not just `BaseChatModel`,
   * so provider-specific properties are accessible.
   */
  use<N extends keyof KnownDrivers & string>(
    name: N,
    overrideConfig?: KnownDrivers[N] extends ChatDriverConfig<infer C, any> ? Partial<C> : never
  ): KnownDrivers[N] extends ChatDriverConfig<any, infer M> ? M : BaseChatModel

  use(name?: string, overrideConfig?: any): BaseChatModel {
    if (!name) {
      if (!this.#defaultClient) {
        this.#defaultClient = this.#createClient(this.#config.default)
      }
      return this.#defaultClient
    }
    return this.#createClient(name, overrideConfig)
  }

  /**
   * Get the resolved config for a driver (shallow copy).
   */
  config<N extends keyof KnownDrivers & string>(
    name: N
  ): KnownDrivers[N] extends ChatDriverConfig<infer C, any> ? C : never {
    const driver = this.#config.drivers[name] as ChatDriverConfig<any, any> | undefined
    if (!driver) {
      throw new Error(`LLM driver '${name}' is not configured`)
    }
    return { ...driver.config } as any
  }

  #createClient(name: string, overrideConfig?: any): BaseChatModel {
    const driver = this.#config.drivers[name as keyof KnownDrivers] as
      | ChatDriverConfig<any, any>
      | undefined
    if (!driver) {
      throw new Error(`LLM driver '${name}' is not configured`)
    }
    const finalConfig = overrideConfig ? { ...driver.config, ...overrideConfig } : driver.config
    return driver.client(finalConfig)
  }

  invoke(...args: Parameters<BaseChatModel['invoke']>): ReturnType<BaseChatModel['invoke']> {
    return this.use().invoke(...args)
  }

  stream(...args: Parameters<BaseChatModel['stream']>): ReturnType<BaseChatModel['stream']> {
    return this.use().stream(...args)
  }

  batch(...args: Parameters<BaseChatModel['batch']>): ReturnType<BaseChatModel['batch']> {
    return this.use().batch(...args)
  }
}
