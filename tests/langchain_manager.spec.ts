import { test } from '@japa/runner'
import { LangchainManager } from '../src/langchain_manager.js'
import { drivers } from '../src/config/define_config.js'
import type { ChatDriverConfig } from '../src/types/index.js'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

/**
 * Minimal mock that satisfies BaseChatModel shape for testing.
 */
function createMockClient(id: string): BaseChatModel {
  return { _modelId: id } as unknown as BaseChatModel
}

type TestDrivers = {
  providerA: ChatDriverConfig<{ apiKey: string; temperature: number }>
  providerB: ChatDriverConfig<{ token: string; maxTokens: number }>
}

function createTestManager() {
  return new LangchainManager<TestDrivers>({
    default: 'providerA',
    drivers: {
      providerA: {
        config: { apiKey: 'key-a', temperature: 0.5 },
        client: (config) => createMockClient(`A:${config.apiKey}:${config.temperature}`),
      },
      providerB: {
        config: { token: 'tok-b', maxTokens: 100 },
        client: (config) => createMockClient(`B:${config.token}:${config.maxTokens}`),
      },
    },
  })
}

test.group('LangchainManager.use()', () => {
  test('use(name) returns a client for a configured driver', ({ assert }) => {
    const manager = createTestManager()
    const client = manager.use('providerA') as any
    assert.equal(client._modelId, 'A:key-a:0.5')
  })

  test('use(name, overrides) merges config', ({ assert }) => {
    const manager = createTestManager()
    const client = manager.use('providerA', { temperature: 0.9 }) as any
    assert.equal(client._modelId, 'A:key-a:0.9')
  })

  test('use() with no args returns cached default client', ({ assert }) => {
    const manager = createTestManager()
    const first = manager.use()
    const second = manager.use()
    assert.strictEqual(first, second)
    assert.equal((first as any)._modelId, 'A:key-a:0.5')
  })

  test('use(name) creates a new instance each call', ({ assert }) => {
    const manager = createTestManager()
    const first = manager.use('providerA')
    const second = manager.use('providerA')
    assert.notStrictEqual(first, second)
  })

  test('use(name, overrides) does not leak between calls', ({ assert }) => {
    const manager = createTestManager()
    const first = manager.use('providerA', { temperature: 1 }) as any
    const second = manager.use('providerA') as any
    assert.equal(first._modelId, 'A:key-a:1')
    assert.equal(second._modelId, 'A:key-a:0.5')
  })

  test('use(name) throws for unconfigured driver', ({ assert }) => {
    const manager = createTestManager()
    assert.throws(
      () => (manager as any).use('nonExistent'),
      /LLM driver 'nonExistent' is not configured/
    )
  })
})

test.group('LangchainManager.config()', () => {
  test('config(name) returns a copy of driver config', ({ assert }) => {
    const manager = createTestManager()
    const conf = manager.config('providerA') as any
    assert.deepEqual(conf, { apiKey: 'key-a', temperature: 0.5 })
    // Mutating the copy doesn't affect the original
    conf.apiKey = 'mutated'
    const fresh = manager.config('providerA') as any
    assert.equal(fresh.apiKey, 'key-a')
  })

  test('config(name) throws for unconfigured driver', ({ assert }) => {
    const manager = createTestManager()
    assert.throws(
      () => (manager as any).config('nonExistent'),
      /LLM driver 'nonExistent' is not configured/
    )
  })
})

test.group('drivers.chat()', () => {
  test('creates a ChatDriverConfig with config and client factory', ({ assert }) => {
    const MockClass = function (config: any) {
      return { ...config, _type: 'mock' }
    } as unknown as new (config: { key: string }) => BaseChatModel

    const entry = drivers.chat(MockClass, { key: 'test' })
    assert.deepEqual(entry.config, { key: 'test' })
    assert.isFunction(entry.client)
  })

  test('client factory creates an instance with given config', ({ assert }) => {
    const MockClass = function (config: any) {
      return { _modelId: `mock:${config.key}` }
    } as unknown as new (config: { key: string }) => BaseChatModel

    const entry = drivers.chat(MockClass, { key: 'hello' })
    const instance = entry.client({ key: 'hello' }) as any
    assert.equal(instance._modelId, 'mock:hello')
  })
})
