import { World, WorldStatus, GovernanceType, Character, ContentStatus, User, UserRole } from './types';

export const APP_NAME = "OpenSaga";

export const MOCK_USER: User = {
  id: 'u1',
  username: 'kai_zen',
  displayName: 'Kai Zen',
  avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop&crop=face',
  bannerUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&h=400&fit=crop',
  role: UserRole.ARCHITECT,
  reputation: 1250,
  bio: 'World builder obsessed with cyberpunk aesthetics and hard magic systems. Building the future, one node at a time.',
  joinedAt: '2023-11-01',
  stats: {
    worldsCreated: 3,
    charactersCreated: 14,
    upvotesReceived: 892
  }
};

export const MOCK_WORLDS: World[] = [
  {
    id: 'w1',
    name: 'Neo-Tokyo 2087',
    description: 'In 2087, Neo-Tokyo rises from the ashes of the Great Collapse. Megacorporations control the upper levels while techno-shamans rule the neon-drenched streets below.',
    heroImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=400&fit=crop',
    accentColor: '#22D3EE',
    genre: ['Cyberpunk', 'Anime', 'Urban Fantasy'],
    status: WorldStatus.OPEN,
    governance: GovernanceType.COMMUNITY_VOTE,
    votingThreshold: 60,
    memberCount: 156,
    characterCount: 24,
    creatorId: 'u1'
  },
  {
    id: 'w2',
    name: 'Aethelgard',
    description: 'A high-fantasy realm where magic is fueled by memories. The more you cast, the more you forget. Entire civilizations have been lost to the Forgetting.',
    heroImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=400&fit=crop',
    accentColor: '#8B5CF6',
    genre: ['Fantasy', 'Tragedy', 'Dark Academia'],
    status: WorldStatus.INVITE_ONLY,
    governance: GovernanceType.LOREKEEPER_COUNCIL,
    votingThreshold: 75,
    memberCount: 42,
    characterCount: 115,
    creatorId: 'u2'
  },
  {
    id: 'w3',
    name: 'The Hollow Sun',
    description: 'Earth\'s sun has gone dark. Humanity survives in biodome cities powered by artificial light. Outside, the Nightlands are teeming with bioluminescent horrors.',
    heroImage: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=400&fit=crop',
    accentColor: '#D56A3A',
    genre: ['Post-Apocalyptic', 'Horror', 'Survival'],
    status: WorldStatus.OPEN,
    governance: GovernanceType.COMMUNITY_VOTE,
    votingThreshold: 55,
    memberCount: 89,
    characterCount: 37,
    creatorId: 'u3'
  },
  {
    id: 'w4',
    name: 'Ironblood Covenant',
    description: 'A steampunk empire where blood is currency and mechanical augmentation determines social class. Revolution brews in the furnace districts.',
    heroImage: 'https://images.unsplash.com/photo-1533422902779-aff35862e462?w=800&h=400&fit=crop',
    accentColor: '#B45309',
    genre: ['Steampunk', 'Political Thriller', 'Class Warfare'],
    status: WorldStatus.OPEN,
    governance: GovernanceType.CREATOR_APPROVED,
    votingThreshold: 100,
    memberCount: 203,
    characterCount: 62,
    creatorId: 'u1'
  },
  {
    id: 'w5',
    name: 'Drift Protocol',
    description: 'Consciousness can be uploaded, forked, and transmitted across interstellar distances. But every copy degrades. Identity is the scarcest resource.',
    heroImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=400&fit=crop',
    accentColor: '#3B82F6',
    genre: ['Hard Sci-Fi', 'Transhumanism', 'Philosophy'],
    status: WorldStatus.OPEN,
    governance: GovernanceType.COMMUNITY_VOTE,
    votingThreshold: 65,
    memberCount: 71,
    characterCount: 18,
    creatorId: 'u4'
  },
  {
    id: 'w6',
    name: 'Verdant Throne',
    description: 'In a world overrun by sentient flora, the last human settlements exist inside the hollowed trunks of continent-spanning mega-trees. The forest votes.',
    heroImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=400&fit=crop',
    accentColor: '#4D7C0F',
    genre: ['Solarpunk', 'Eco-Fantasy', 'Mythic'],
    status: WorldStatus.CLOSED,
    governance: GovernanceType.LOREKEEPER_COUNCIL,
    votingThreshold: 80,
    memberCount: 34,
    characterCount: 91,
    creatorId: 'u5'
  }
];

export const MOCK_CHARACTERS: Character[] = [
  {
    id: 'c1',
    name: 'The Fixer',
    description: 'Marcus Chen grew up in the shadows of Sector 7. He brokers deals between corps and street gangs, never touching a weapon but always armed with leverage.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    archetype: 'Mastermind',
    worldId: 'w1',
    status: ContentStatus.CANON,
    authorId: 'u3',
    votes: { up: 847, down: 52 },
    createdAt: '2023-12-15'
  },
  {
    id: 'c2',
    name: 'Shadow Protocol',
    description: 'A rogue AI inhabiting a robotic chassis, seeking "true" consciousness through human connection. Its creators want it decommissioned.',
    imageUrl: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400&h=500&fit=crop',
    archetype: 'Infiltrator',
    worldId: 'w1',
    status: ContentStatus.PROPOSAL,
    authorId: 'u4',
    votes: { up: 134, down: 24 },
    createdAt: '2023-12-20'
  },
  {
    id: 'c3',
    name: 'Lyra Dawnforge',
    description: 'Once the kingdom\'s most celebrated Memory Mage, she sacrificed all memories of her family to seal a rift in the world. Now she fights to remember why she fights.',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face',
    archetype: 'Tragic Hero',
    worldId: 'w2',
    status: ContentStatus.CANON,
    authorId: 'u2',
    votes: { up: 1203, down: 31 },
    createdAt: '2023-11-05'
  },
  {
    id: 'c4',
    name: 'Furnace',
    description: 'Born in the smelting pits with a mechanical heart he built himself at age twelve. Now he leads the Workers\' Uprising with a wrench in one hand and a manifesto in the other.',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    archetype: 'Revolutionary',
    worldId: 'w4',
    status: ContentStatus.CANON,
    authorId: 'u1',
    votes: { up: 562, down: 88 },
    createdAt: '2024-01-10'
  },
  {
    id: 'c5',
    name: 'Nyx-7',
    description: 'The seventh copy of consciousness pioneer Dr. Nyx Okafor. Each fork remembers less. Nyx-7 knows she\'s degrading but refuses to accept she isn\'t the original.',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face',
    archetype: 'Unreliable Narrator',
    worldId: 'w5',
    status: ContentStatus.PROPOSAL,
    authorId: 'u4',
    votes: { up: 218, down: 45 },
    createdAt: '2024-02-01'
  },
  {
    id: 'c6',
    name: 'Moth Keeper',
    description: 'A blind hermit who communicates with the sentient forest through giant moths. The trees speak through her, but their language is dying.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face',
    archetype: 'Oracle',
    worldId: 'w6',
    status: ContentStatus.CANON,
    authorId: 'u5',
    votes: { up: 394, down: 12 },
    createdAt: '2024-01-22'
  }
];
