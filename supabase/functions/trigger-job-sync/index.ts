import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!
const GITHUB_OWNER = Deno.env.get('GITHUB_OWNER')!   // e.g. netc-fleet-services
const GITHUB_REPO  = Deno.env.get('GITHUB_REPO')!    // e.g. maintenance-tracker
const WORKFLOW     = 'sync_on_job.yml'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW}/dispatches`

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept':        'application/vnd.github+json',
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return new Response(
        JSON.stringify({ error: `GitHub API ${resp.status}: ${text}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 204 No Content on success
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
