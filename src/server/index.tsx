import { Hono } from 'hono'
import { renderer } from './renderer'

type Env = {
  ACCOUNT_ID: string
  API_TOKEN: string
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/fetch-gslides', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.json({ error: 'URL parameter is required' }, 400)
  }

  try {
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbzn93mgAasyQMF1URQ_fJooXBXNbRIKCvnH3HXExBpMfTo2e_XTrNOlrJw557uJgUvG/exec?url=${encodeURIComponent(url)}`
    )
    const data = await response.json() as Record<string, unknown>
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to fetch data' }, 500)
  }
})

app.get('/api/screenshot', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.json({ error: 'URL parameter is required' }, 400)
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.ACCOUNT_ID}/browser-rendering/screenshot`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          viewport: {
            width: 1280,
            height: 720
          },
          gotoOptions: {
            waitUntil: 'networkidle0',
            timeout: 45000
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch screenshot')
    }

    const buffer = await response.arrayBuffer()
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="screenshot.png"'
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch screenshot' }, 500)
  }
})

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <div id="root" />
  )
})

export default app
