# @mixxtor/adonisjs-pusher

An AdonisJS provider for Pusher real-time messaging service.

## Installation

```bash
npm install @mixxtor/adonisjs-pusher
```

## Configuration

After installation, run the configure script:

```bash
node ace configure @mixxtor/adonisjs-pusher
```

This will:

- Create `config/pusher.ts` configuration file
- Add Pusher environment variables to `start/env.ts`
- Register the provider in `adonisrc.ts`

## Environment Variables

Add the following environment variables to your `.env` file:

```env
PUSHER_HOST=api-mt1.pusher.com
PUSHER_PORT=443
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
PUSHER_TLS=true
```

## Usage

### In your controllers or services:

```typescript
import { inject } from '@adonisjs/core'
import type Pusher from 'pusher'

export default class ChatController {
  @inject()
  async sendMessage({ request }: HttpContext, pusher: Pusher) {
    const { message, channel } = request.only(['message', 'channel'])

    await pusher.trigger(channel, 'new-message', {
      message,
      timestamp: new Date().toISOString(),
    })

    return { success: true }
  }
}
```

### Using the container directly:

```typescript
const pusher = await app.container.make('pusher')

await pusher.trigger('my-channel', 'my-event', {
  message: 'Hello World!',
})
```

## Configuration

The package uses the configuration from `config/pusher.ts`. You can customize it as needed:

```typescript
import env from '#start/env'
import type { Options } from 'pusher'
import { defineConfig } from '@mixxtor/adonisjs'

export default defineConfig({
  host: env.get('PUSHER_HOST'),
  port: env.get('PUSHER_PORT'),
  appId: env.get('PUSHER_APP_ID'),
  key: env.get('PUSHER_APP_KEY'),
  secret: env.get('PUSHER_APP_SECRET'),
  cluster: env.get('PUSHER_APP_CLUSTER', 'mt1'),
  useTLS: env.get('PUSHER_TLS', true),
})
```

## License

MIT
