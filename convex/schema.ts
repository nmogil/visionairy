import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table (synced from Clerk)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    gamesPlayed: v.number(),
    gamesWon: v.number(),
    totalScore: v.number(),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  }).index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  // Question cards collection
  questionCards: defineTable({
    text: v.string(),
    category: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
    isActive: v.boolean(),
    usageCount: v.number(),
  }).index("by_category", ["category", "isActive"])
    .index("by_usage", ["usageCount"]),

  // Game rooms
  rooms: defineTable({
    code: v.string(), // 6-character room code
    hostId: v.string(), // Clerk user ID
    name: v.optional(v.string()), // Optional room name
    settings: v.object({
      maxPlayers: v.number(), // 3-10
      roundTimer: v.number(), // 15-60 seconds
      totalRounds: v.number(), // 5-20
      regenerationsPerPlayer: v.number(), // Default: 3
      isPublic: v.boolean(), // Show in public rooms list
    }),
    state: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("roundActive"),
      v.literal("voting"),
      v.literal("roundEnd"),
      v.literal("gameOver")
    ),
    currentRound: v.number(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  }).index("by_code", ["code"])
    .index("by_state", ["state", "createdAt"])
    .index("by_public", ["settings.isPublic", "state"]),

  // Players in rooms
  players: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(), // Clerk user ID
    nickname: v.string(),
    avatar: v.optional(v.string()),
    score: v.number(),
    regenerationsUsed: v.number(),
    isHost: v.boolean(),
    isConnected: v.boolean(),
    joinedAt: v.number(),
    lastSeenAt: v.number(),
  }).index("by_room", ["roomId", "isConnected"])
    .index("by_user_room", ["userId", "roomId"]),

  // Game rounds
  rounds: defineTable({
    roomId: v.id("rooms"),
    roundNumber: v.number(),
    questionCardId: v.id("questionCards"),
    cardCzarId: v.id("players"),
    winnerId: v.optional(v.id("players")),
    state: v.union(
      v.literal("prompting"),
      v.literal("generating"),
      v.literal("voting"),
      v.literal("complete")
    ),
    promptDeadline: v.number(), // Timestamp
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_room", ["roomId", "roundNumber"])
    .index("by_state", ["state", "startedAt"]),

  // Player prompts
  prompts: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    text: v.string(),
    submittedAt: v.number(),
  }).index("by_round", ["roundId"])
    .index("by_player", ["playerId", "roundId"]),

  // Generated images
  generatedImages: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    promptId: v.id("prompts"),
    prompt: v.string(), // Denormalized for quick access
    imageStorageId: v.id("_storage"),
    imageUrl: v.string(), // Convex storage URL
    thumbnailStorageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
    generationTimeMs: v.number(),
    isWinner: v.boolean(),
    regenerationNumber: v.number(), // 0 for first generation
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_round", ["roundId", "isWinner"])
    .index("by_player_round", ["playerId", "roundId"]),

  // Presence tracking (who's online/typing)
  presence: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(),
    playerId: v.id("players"),
    status: v.object({
      isTyping: v.boolean(),
      hasSubmitted: v.boolean(),
      lastActivity: v.number(),
    }),
    expiresAt: v.number(), // Auto-cleanup stale presence
  }).index("by_room", ["roomId", "expiresAt"])
    .index("by_user", ["userId", "roomId"]),

  // Game statistics (for analytics)
  gameStats: defineTable({
    roomId: v.id("rooms"),
    totalPlayers: v.number(),
    totalRounds: v.number(),
    averageGenerationTime: v.number(),
    totalRegenerations: v.number(),
    completedAt: v.number(),
  }).index("by_completed", ["completedAt"]),

  // User statistics (for dashboard)
  userStats: defineTable({
    userId: v.string(),
    period: v.string(), // "daily", "weekly", "monthly", "all-time"
    date: v.string(), // ISO date string
    gamesPlayed: v.number(),
    gamesWon: v.number(),
    imagesGenerated: v.number(),
    promptsSubmitted: v.number(),
    votesReceived: v.number(),
  }).index("by_user_period", ["userId", "period", "date"]),
});