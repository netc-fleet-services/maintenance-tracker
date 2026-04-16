const WORKFLOW = 'sync_on_job.yml'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const token = Deno.env.get('GITHUB_TOKEN')
  const owner = Deno.env.get('GITHUB_OWNER')
  const repo  = Deno.env.get('GITHUB_REPO')

  const missing = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO']
    .filter(k => !Deno.env.get(k))

  if (missing.length) {
    console.error('Missing secrets:', missing)
    return json({ error: `Missing secrets: ${missing.join(', ')}` }, 500)
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW}/dispatches`
  console.log('POST', url)

  try {
    const gh = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization':        `Bearer ${token}`,
        'Accept':               'application/vnd.github+json',
        'Content-Type':         'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'main' }),
    })

    const text = await gh.text()
    console.log(`GitHub ${gh.status}:`, text)

    if (!gh.ok) return json({ error: `GitHub ${gh.status}: ${text}` }, 502)

    return json({ ok: true })
  } catch (err) {
    console.error(err)
    return json({ error: String(err) }, 500)
  }
})
