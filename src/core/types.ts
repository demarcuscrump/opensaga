// Governance Models
export enum GovernanceType {
  CREATOR_APPROVED = 'CREATOR_APPROVED',
  COMMUNITY_VOTE = 'COMMUNITY_VOTE',
  LOREKEEPER_COUNCIL = 'LOREKEEPER_COUNCIL',
}

// Content Status
export enum ContentStatus {
  DRAFT = 'DRAFT',
  PROPOSAL = 'PROPOSAL',
  CANON = 'CANON',
  REJECTED = 'REJECTED',
}

export enum WorldStatus {
  OPEN = 'OPEN',
  INVITE_ONLY = 'INVITE_ONLY',
  CLOSED = 'CLOSED',
}

// User Roles
export enum UserRole {
  CREATOR = 'CREATOR',
  LOREKEEPER = 'LOREKEEPER',
  ARCHITECT = 'ARCHITECT',
  CONTRIBUTOR = 'CONTRIBUTOR',
  VISITOR = 'VISITOR',
}

// Entities
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl: string;
  role: UserRole;
  reputation: number;
  bio: string;
  joinedAt: string;
  stats: {
    worldsCreated: number;
    charactersCreated: number;
    upvotesReceived: number;
  }
}

export interface World {
  id: string;
  name: string;
  description: string;
  heroImage: string;
  accentColor?: string;
  genre: string[];
  status: WorldStatus;
  governance: GovernanceType;
  votingThreshold: number; // e.g. 60 for 60%
  memberCount: number;
  characterCount: number;
  creatorId: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  archetype: string;
  powers?: string[];
  worldId: string;
  status: ContentStatus;
  authorId: string;
  votes: {
    up: number;
    down: number;
  };
  createdAt: string;
}

export interface Proposal extends Character {
  votingEndsAt: string;
  justification: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}
