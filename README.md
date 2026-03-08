# @mixxtor/adonisjs-langchain

An AdonisJS v6/v7 provider for [LangChain](https://js.langchain.com/) with multi-LLM driver support, type-safe provider selection, and full autocompletion.

## Features

- Configure multiple LLM providers (OpenAI, Anthropic, or any LangChain chat model)
- `llm.use('openai')` returns the **actual class type** (`ChatOpenAI`), not just `BaseChatModel` — provider-specific properties are accessible
- Type-safe driver names — `llm.use('')` or `llm.use('typo')` are compile-time errors
- Typed config overrides per driver
- Read the resolved config for any driver via `llm.config('openai')`
- Convenience delegates: `llm.invoke()`, `llm.stream()`, `llm.batch()` → default driver

## Installation

```bash
npm install @mixxtor/adonisjs-langchain @langchain/core
```

Install the LangChain model packages you need:

```bash
npm install @langchain/openai     # OpenAI / Azure OpenAI
npm install @langchain/anthropic  # Anthropic Claude
```

## Configuration

Run the configure command to scaffold the config file and register the provider:

```bash
node ace configure @mixxtor/adonisjs-langchain
```

This will:

- Create `config/langchain.ts`
- Register `@mixxtor/adonisjs-langchain/provider` in `adonisrc.ts`

## Config file

Edit `config/langchain.ts` to set up your drivers:

```typescript
// config/langchain.ts
import env from '#start/env'
import { defineConfig, drivers, type InferDrivers } from '@mixxtor/adonisjs-langchain'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'

const langchainConfig = defineConfig({
  default: 'openai',
  drivers: {
    openai: drivers.chat(ChatOpenAI, {
      apiKey: env.get('OPENAI_API_KEY'),
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    }),
    anthropic: drivers.chat(ChatAnthropic, {
      anthropicApiKey: env.get('ANTHROPIC_API_KEY'),
      model: 'claude-3-5-haiku-20241022',
      temperature: 0.7,
      maxTokens: 2000,
    }),
  },
})

export default langchainConfig

// Augment the package's interface so llm.use() knows your driver names
declare module '@mixxtor/adonisjs-langchain/types' {
  interface LangchainDrivers extends InferDrivers<typeof langchainConfig> {}
}
```

## Environment variables

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

Import the pre-resolved singleton from the service file:

```typescript
import llm from '@mixxtor/adonisjs-langchain/services/main'
```

### Default driver

```typescript
// Invoke the default driver (cached singleton)
const response = await llm.invoke('What is the capital of France?')

// Or stream
for await (const chunk of await llm.stream('Tell me a joke')) {
  process.stdout.write(chunk.content as string)
}
```

### Named driver

`use(name)` returns a new instance of the actual class every call, so provider-specific properties are accessible:

```typescript
// Returns ChatOpenAI (not just BaseChatModel)
const openai = llm.use('openai')
console.log(openai.clientConfig)    // ← ChatOpenAI-specific property ✓

// Returns ChatAnthropic
const claude = llm.use('anthropic')
await claude.invoke('Hello')
```

### Override config at call time

```typescript
const creative = llm.use('openai', { temperature: 1.0, model: 'gpt-4o' })
const response = await creative.invoke('Write a poem')
```

### Read a driver's resolved config

```typescript
const conf = llm.config('openai')
// conf is typed as { apiKey: string; model: string; temperature: number; ... }
console.log(conf.model)  // 'gpt-4o-mini'
```

### Convenience delegates (default driver)

```typescript
// These all delegate to the default driver
await llm.invoke('Hello')
await llm.stream('Hello')
await llm.batch(['Hello', 'World'])
```

## Type safety

Driver names are fully type-checked after the `declare module` augmentation:

```typescript
llm.use('openai')      // ✓
llm.use('anthropic')   // ✓
llm.use('typo')        // ✗ compile error
llm.use('')            // ✗ compile error

// Override types match the driver's config
llm.use('openai', { temperature: 0.5 })      // ✓
llm.use('openai', { anthropicApiKey: '...' }) // ✗ compile error — wrong driver
```

## Manual driver entry (without `drivers.chat`)

For advanced use cases you can provide the driver entry manually:

```typescript
import { ChatOpenAI } from '@langchain/openai'

const langchainConfig = defineConfig({
  default: 'openai',
  drivers: {
    openai: {
      config: { apiKey: '...', model: 'gpt-4o-mini' },
      client: (config) => new ChatOpenAI(config),
    },
  },
})
```

## API reference

### `defineConfig(config)`

Wraps your config in an AdonisJS `ConfigProvider` resolved at boot time.

| Field | Type | Description |
|-------|------|-------------|
| `default` | `string` | Key of the default driver |
| `drivers` | `Record<string, ChatDriverConfig>` | Named driver map |

### `drivers.chat(Client, config)`

Creates a typed `ChatDriverConfig` entry. Infers both the config type and the return type from the class constructor.

```typescript
drivers.chat(ChatOpenAI, { model: 'gpt-4o-mini', ... })
//           ↑ Class     ↑ Typed to ChatOpenAI constructor params
```

### `llm.use()`

Returns the **cached** default client (`BaseChatModel`).

### `llm.use(name, overrides?)`

Returns a **new** instance of the named driver's class. The return type is the exact class (e.g. `ChatOpenAI`), not `BaseChatModel`. Overrides are typed to that driver's config.

### `llm.config(name)`

Returns a shallow copy of the resolved config for the named driver. Throws if the driver is not configured.

### `llm.invoke()` / `llm.stream()` / `llm.batch()`

Delegates to the default driver's client.

## License

MIT

