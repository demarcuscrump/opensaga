export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          banner_url: string | null;
          bio: string;
          role: 'CREATOR' | 'LOREKEEPER' | 'ARCHITECT' | 'CITIZEN' | 'WANDERER';
          reputation: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string;
          role?: 'CREATOR' | 'LOREKEEPER' | 'ARCHITECT' | 'CITIZEN' | 'WANDERER';
          reputation?: number;
          created_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string;
          role?: 'CREATOR' | 'LOREKEEPER' | 'ARCHITECT' | 'CITIZEN' | 'WANDERER';
          reputation?: number;
        };
        Relationships: [];
      };
      worlds: {
        Row: {
          id: string;
          name: string;
          description: string;
          hero_image: string | null;
          genre: string[];
          status: 'OPEN' | 'INVITE_ONLY' | 'CLOSED';
          governance: 'CREATOR_APPROVED' | 'COMMUNITY_VOTE' | 'LOREKEEPER_COUNCIL';
          voting_threshold: number;
          creator_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          hero_image?: string | null;
          genre?: string[];
          status?: 'OPEN' | 'INVITE_ONLY' | 'CLOSED';
          governance?: 'CREATOR_APPROVED' | 'COMMUNITY_VOTE' | 'LOREKEEPER_COUNCIL';
          voting_threshold?: number;
          creator_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          hero_image?: string | null;
          genre?: string[];
          status?: 'OPEN' | 'INVITE_ONLY' | 'CLOSED';
          governance?: 'CREATOR_APPROVED' | 'COMMUNITY_VOTE' | 'LOREKEEPER_COUNCIL';
          voting_threshold?: number;
        };
        Relationships: [];
      };
      bible_sections: {
        Row: {
          id: string;
          world_id: string;
          section_key: string;
          title: string;
          content: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          section_key: string;
          title: string;
          content?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      entities: {
        Row: {
          id: string;
          world_id: string;
          type: 'CHARACTER' | 'LORE' | 'FACTION';
          data: Json;
          status: 'DRAFT' | 'PROPOSAL' | 'CANON' | 'REJECTED';
          author_id: string;
          justification: string | null;
          voting_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          world_id: string;
          type: 'CHARACTER' | 'LORE' | 'FACTION';
          data?: Json;
          status?: 'DRAFT' | 'PROPOSAL' | 'CANON' | 'REJECTED';
          author_id: string;
          justification?: string | null;
          voting_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          data?: Json;
          status?: 'DRAFT' | 'PROPOSAL' | 'CANON' | 'REJECTED';
          justification?: string | null;
          voting_ends_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          entity_id: string;
          user_id: string;
          vote_type: 'UP' | 'DOWN';
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_id: string;
          user_id: string;
          vote_type: 'UP' | 'DOWN';
          created_at?: string;
        };
        Update: {
          vote_type?: 'UP' | 'DOWN';
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          world_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          world_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          role?: string;
        };
        Relationships: [];
      };
      activity: {
        Row: {
          id: string;
          world_id: string | null;
          user_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          world_id?: string | null;
          user_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_reputation: {
        Args: {
          target_user_id: string;
          amount: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
