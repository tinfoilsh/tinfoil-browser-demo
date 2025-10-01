# Tinfoil Browser Integration Demo

Minimal Next.js demo that streams OpenAI‑style chat completions through the `tinfoil` client in the browser. It shows a simple chat UI and model selection.

**[View Live Demo](https://demo.tinfoil.sh)**

## Quick Start

Requirements

- Node.js 20.18.1+
- npm

Run

```bash
npm install
npm run dev
# http://localhost:3000
```

## How It Works

- A `TinfoilAI` client is created in the browser with `dangerouslyAllowBrowser: true`, then initialized with `await client.ready()`.
- Chat requests stream via `client.chat.completions.create({ stream: true, ... })` and are appended token‑by‑token.

### Minimal usage

```ts
import { TinfoilAI } from 'tinfoil'

const client = new TinfoilAI({
  apiKey: '<YOUR_API_KEY>',
  dangerouslyAllowBrowser: true,
})

await client.ready()

const stream = await client.chat.completions.create({
  model: '<model-id>',
  stream: true,
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
})

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content || ''
  // append delta to UI
}
```
