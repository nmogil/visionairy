// Game configuration constants
export const GAME_CONFIG = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 10,
  DEFAULT_MAX_PLAYERS: 8,
  DEFAULT_ROUND_TIMER: 30, // seconds
  DEFAULT_TOTAL_ROUNDS: 10,
  DEFAULT_REGENERATIONS_PER_PLAYER: 3,
  ROOM_CODE_LENGTH: 6,
} as const;

// UI constants
export const UI_CONFIG = {
  ROOM_CODE_REGEX: /^[A-Z]{6}$/,
  MAX_PROMPT_LENGTH: 200,
  IMAGE_GENERATION_TIMEOUT: 30000, // 30 seconds
} as const;

// API endpoints (relative)
export const API_ROUTES = {
  OG_IMAGE: '/api/og',
  CLERK_WEBHOOK: '/api/webhooks/clerk',
} as const;