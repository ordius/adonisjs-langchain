/**
 * Type-level tests — this file should compile with zero errors.
 * If any line errors, the type inference chain is broken.
 *
 * Run: npx tsc --noEmit --noUnusedLocals false
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { defineConfig, drivers } from '../src/config/define_config.js'
import type { LangchainManager } from '../src/langchain_manager.js'
import type { InferDrivers, ChatDriverConfig } from '../src/types/index.js'

// ---------------------------------------------------------------------------
// Fake constructors for type tests (ambient declarations — no runtime needed)
// ---------------------------------------------------------------------------

type FakeAConfig = { apiKey: string; temperature: number }
type FakeBConfig = { token: string; maxTokens: number }

type FakeChatAInstance = BaseChatModel & { clientConfig: FakeAConfig }
type FakeChatBInstance = BaseChatModel & { specialMethod(): void }

declare const FakeChatA: new (config: FakeAConfig) => FakeChatAInstance
declare const FakeChatB: new (config: FakeBConfig) => FakeChatBInstance

// ---------------------------------------------------------------------------
// 1. drivers.chat() infers config type from class constructor
// ---------------------------------------------------------------------------

// @ts-expect-error — 'badProp' does not exist on FakeChatA constructor params
drivers.chat(FakeChatA, { apiKey: 'test', temperature: 0.5, badProp: true })

// ---------------------------------------------------------------------------
// 2. defineConfig + drivers.chat — full type chain
// ---------------------------------------------------------------------------

const testConfig = defineConfig({
  default: 'fast',
  drivers: {
    fast: drivers.chat(FakeChatA, { apiKey: 'k1', temperature: 0.5 }),
    smart: drivers.chat(FakeChatB, { token: 'abc', maxTokens: 4096 }),
  },
})

// ---------------------------------------------------------------------------
// 3. InferDrivers extracts the correct driver map
// ---------------------------------------------------------------------------

type Inferred = InferDrivers<typeof testConfig>

type CheckFast =
  Inferred['fast'] extends ChatDriverConfig<FakeAConfig, FakeChatAInstance> ? true : false
const fast: CheckFast = true

type CheckSmart =
  Inferred['smart'] extends ChatDriverConfig<FakeBConfig, FakeChatBInstance> ? true : false
const smart: CheckSmart = true

// ---------------------------------------------------------------------------
// 4. LangchainManager.use(name) returns the actual class, not BaseChatModel
// ---------------------------------------------------------------------------

type TestDrivers = {
  alpha: ChatDriverConfig<{ apiKey: string }, FakeChatAInstance>
  beta: ChatDriverConfig<{ secret: string }, FakeChatBInstance>
}

declare const manager: LangchainManager<TestDrivers>

// Returns the actual class type — provider-specific members are accessible
const alphaClient: FakeChatAInstance = manager.use('alpha')
alphaClient.clientConfig // ← accessible because typed as FakeChatAInstance, not BaseChatModel

const betaClient: FakeChatBInstance = manager.use('beta')
betaClient.specialMethod() // ← accessible because typed as FakeChatBInstance

// Overrides are typed to the driver's config
manager.use('alpha', { apiKey: 'override' })
manager.use('beta', { secret: 'override' })

// @ts-expect-error — 'gamma' is not a configured driver
manager.use('gamma')

// @ts-expect-error — '' is not a configured driver
manager.use('')

// @ts-expect-error — wrong override type for 'alpha'
manager.use('alpha', { secret: 'wrong' })

// ---------------------------------------------------------------------------
// 5. config() returns typed provider config
// ---------------------------------------------------------------------------

const alphaConf: { apiKey: string } = manager.config('alpha')
const betaConf: { secret: string } = manager.config('beta')

// @ts-expect-error — 'unknown' is not a configured driver
manager.config('unknown')

// ---------------------------------------------------------------------------
// 6. default must be a known key
// ---------------------------------------------------------------------------

defineConfig({
  // @ts-expect-error — 'nonexistent' is not a key in drivers
  default: 'nonexistent',
  drivers: {
    onlyOne: drivers.chat(FakeChatA, { apiKey: 'x', temperature: 0 }),
  },
})

// ---------------------------------------------------------------------------
// 7. use() with no args returns BaseChatModel (default)
// ---------------------------------------------------------------------------

const defaultClient: BaseChatModel = manager.use()

// ---------------------------------------------------------------------------
// 8. Convenience methods delegate types
// ---------------------------------------------------------------------------

const invokeResult: ReturnType<BaseChatModel['invoke']> = manager.invoke('hello')
const streamResult: ReturnType<BaseChatModel['stream']> = manager.stream('hello')
