/**
 * Agent Tools — Supabase-backed tools for auto-context fetching
 *
 * These tools allow agent workflows to autonomously pull context
 * from the database instead of requiring the user to paste text.
 *
 * Per CREATOR_STUDIO_PRD.md §Context Injection:
 * "Every AI call includes: World Bible, Existing Canon, User's draft,
 *  Tool-specific system prompt"
 */

import { z } from 'zod';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

function tool<TArgs>(invoke: (args: TArgs) => Promise<string>, _metadata: unknown) {
  return { invoke };
}

// ─── Fetch World Bible ──────────────────────────────────────────────

export const fetchWorldBible = tool(
  async ({ worldId }: { worldId: string }): Promise<string> => {
    if (!isSupabaseConfigured) {
      return '[No Supabase configured — World Bible unavailable. Evaluate internal consistency only.]';
    }

    const { data: sections, error } = await supabase
      .from('bible_sections')
      .select('title, content, sort_order')
      .eq('world_id', worldId)
      .order('sort_order', { ascending: true });

    if (error || !sections || sections.length === 0) {
      // Fallback: use the world's description as minimal context
      const { data: world } = await supabase
        .from('worlds')
        .select('name, description, genre, governance')
        .eq('id', worldId)
        .single();

      if (world) {
        return `WORLD: ${world.name}\nGENRE: ${(world.genre || []).join(', ')}\nGOVERNANCE: ${world.governance}\n\n${world.description}\n\n[No detailed Bible sections found. Using world description as context.]`;
      }
      return '[World Bible not found for this world.]';
    }

    const bible = sections
      .map(s => `## ${s.title}\n${s.content || '(empty section)'}`)
      .join('\n\n---\n\n');

    return `WORLD BIBLE\n${'═'.repeat(40)}\n\n${bible}`;
  },
  {
    name: 'fetchWorldBible',
    description: 'Fetches the complete World Bible (all sections) for a given world. Use this to get the source of truth for consistency checking.',
    schema: z.object({
      worldId: z.string().describe('The UUID of the world to fetch the Bible for'),
    }),
  }
);

// ─── Fetch Canon Entities ───────────────────────────────────────────

export const fetchCanonEntities = tool(
  async ({ worldId, entityType }: { worldId: string; entityType?: 'CHARACTER' | 'LORE' | 'FACTION' }): Promise<string> => {
    if (!isSupabaseConfigured) {
      return '[No Supabase configured — Canon entities unavailable.]';
    }

    let query = supabase
      .from('entities')
      .select('data, type, status')
      .eq('world_id', worldId)
      .in('status', ['CANON', 'PROPOSAL']);

    if (entityType) {
      query = query.eq('type', entityType);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

    if (error || !data || data.length === 0) {
      return '[No canon entities found in this world.]';
    }

    const entries = data.map(row => {
      const d = row.data as Record<string, any>;
      return `[${row.type}] ${d.name || 'Unnamed'} (${row.status}): ${d.description || d.archetype || 'No description'}`;
    });

    return `EXISTING CANON & PROPOSALS (${data.length} entries)\n${'─'.repeat(40)}\n${entries.join('\n')}`;
  },
  {
    name: 'fetchCanonEntities',
    description: 'Fetches all canon and proposal entities for a world. Use this to check for contradictions with existing content.',
    schema: z.object({
      worldId: z.string().describe('The UUID of the world'),
      entityType: z.string().optional().describe('Filter by type: CHARACTER, LORE, or FACTION'),
    }),
  }
);

// ─── Fetch Characters ───────────────────────────────────────────────

export const fetchCharacters = tool(
  async ({ worldId }: { worldId: string }): Promise<string> => {
    if (!isSupabaseConfigured) {
      return '[No Supabase configured — Character list unavailable.]';
    }

    const { data, error } = await supabase
      .from('entities')
      .select('data, status')
      .eq('world_id', worldId)
      .eq('type', 'CHARACTER')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data || data.length === 0) {
      return '[No characters found in this world.]';
    }

    const chars = data.map(row => {
      const d = row.data as Record<string, any>;
      const powers = d.powers?.length > 0 ? ` | Powers: ${d.powers.join(', ')}` : '';
      return `• ${d.name || 'Unnamed'} — ${d.archetype || 'Unknown archetype'}${powers} (${row.status})`;
    });

    return `CHARACTERS IN WORLD (${data.length})\n${'─'.repeat(40)}\n${chars.join('\n')}`;
  },
  {
    name: 'fetchCharacters',
    description: 'Fetches the list of all characters in a world with their names, archetypes, and powers. Use this for relationship building and contradiction checking.',
    schema: z.object({
      worldId: z.string().describe('The UUID of the world'),
    }),
  }
);

// ─── Fetch World Info ───────────────────────────────────────────────

export const fetchWorldInfo = tool(
  async ({ worldId }: { worldId: string }): Promise<string> => {
    if (!isSupabaseConfigured) {
      return '[No Supabase configured — World info unavailable.]';
    }

    const { data: world, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('id', worldId)
      .single();

    if (error || !world) {
      return '[World not found.]';
    }

    return `WORLD: ${world.name}\nGENRE: ${(world.genre || []).join(', ')}\nSTATUS: ${world.status}\nGOVERNANCE: ${world.governance}\nVOTING THRESHOLD: ${world.voting_threshold}%\n\n${world.description}`;
  },
  {
    name: 'fetchWorldInfo',
    description: 'Fetches basic info about a world (name, genre, governance, description).',
    schema: z.object({
      worldId: z.string().describe('The UUID of the world'),
    }),
  }
);

// ─── All tools array (for binding to models) ────────────────────────

export const agentTools = [fetchWorldBible, fetchCanonEntities, fetchCharacters, fetchWorldInfo];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const agentToolsByName: Record<string, any> = {
  fetchWorldBible,
  fetchCanonEntities,
  fetchCharacters,
  fetchWorldInfo,
};
