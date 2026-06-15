const BASE = '/api'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}

export const api = {
  summary:     ()     => get('/summary'),
  trends:      (days) => get(`/trends?days=${days ?? 60}`),
  heatmap:     ()     => get('/heatmap'),
  tod:         ()     => get('/tod'),
  hourly:      ()     => get('/hourly'),
  importances: ()     => get('/importances'),
  model:       ()     => get('/model'),
  predict:     (body) => post('/predict', body),
}
