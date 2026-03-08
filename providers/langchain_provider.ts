import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@adonisjs/core/exceptions'

export default class LangchainProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('langchain', async () => {
      const { LangchainManager } = await import('../src/langchain_manager.js')

      const langchainConfigProvider = this.app.config.get('langchain')

      if (!langchainConfigProvider) {
        throw new RuntimeException(
          'Missing "config/langchain.ts". Run "node ace configure @ordius/adonisjs-langchain"'
        )
      }

      const config = await configProvider.resolve(this.app, langchainConfigProvider)
      if (!config) {
        throw new RuntimeException(
          'Invalid langchain config. Use "defineConfig" from @ordius/adonisjs-langchain'
        )
      }

      return new LangchainManager(config as any)
    })
  }

  async boot() {}
  async start() {}
  async ready() {}
  async shutdown() {}
}
