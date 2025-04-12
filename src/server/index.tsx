import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()


app.get('/api', async (c) => {
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

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <>
      <h1 className="text-3xl font-bold underline">Hello from SSR</h1>
      <div id="root"></div>
    </>
  )
})

export default app
