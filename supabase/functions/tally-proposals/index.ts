// Supabase Edge Function: Auto-tally expired proposals
// Deploy: supabase functions deploy tally-proposals
// Schedule: Set up a cron job to call this every hour via pg_cron or external scheduler
//
// curl -X POST https://your-project.supabase.co/functions/v1/tally-proposals \
//   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Find all expired proposals
    const now = new Date().toISOString()
    const { data: expired, error: fetchErr } = await supabase
      .from('entities')
      .select('id, world_id, type, data, author_id')
      .eq('status', 'PROPOSAL')
      .lt('voting_ends_at', now)

    if (fetchErr) throw fetchErr
    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ tallied: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const results = []

    for (const entity of expired) {
      // 2. Get world threshold
      const { data: world } = await supabase
        .from('worlds')
        .select('voting_threshold')
        .eq('id', entity.world_id)
        .single()

      const threshold = world?.voting_threshold ?? 60

      // 3. Count votes
      const { data: votes } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('entity_id', entity.id)

      const up = votes?.filter((v: any) => v.vote_type === 'UP').length ?? 0
      const down = votes?.filter((v: any) => v.vote_type === 'DOWN').length ?? 0
      const total = up + down
      const approval = total > 0 ? Math.round((up / total) * 100) : 0
      const passed = approval >= threshold
      const newStatus = passed ? 'CANON' : 'REJECTED'

      // 4. Update entity
      await supabase
        .from('entities')
        .update({ status: newStatus, updated_at: now })
        .eq('id', entity.id)

      // 5. Award reputation if canonized
      if (passed) {
        const repBonus = entity.type === 'CHARACTER' ? 10 : entity.type === 'LORE' ? 5 : 8
        const { data: profile } = await supabase
          .from('profiles')
          .select('reputation')
          .eq('id', entity.author_id)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({ reputation: (profile.reputation || 0) + repBonus })
            .eq('id', entity.author_id)
        }
      }

      // 6. Log activity
      await supabase.from('activity').insert({
        world_id: entity.world_id,
        user_id: entity.author_id,
        action: passed ? 'ENTITY_CANONIZED' : 'ENTITY_REJECTED',
        target_type: entity.type,
        target_id: entity.id,
        metadata: {
          name: (entity.data as any)?.name || 'Unknown',
          approval,
          threshold,
          totalVotes: total,
          automated: true,
        },
      })

      results.push({
        entityId: entity.id,
        type: entity.type,
        name: (entity.data as any)?.name,
        status: newStatus,
        approval,
        threshold,
        totalVotes: total,
      })
    }

    return new Response(JSON.stringify({ tallied: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
