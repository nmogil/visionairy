import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a unique 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new room
export const createRoom = mutation({
  args: {
    settings: v.object({
      maxPlayers: v.number(),
      roundTimer: v.number(),
      totalRounds: v.number(),
      isPublic: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to create a room");
    }
    const userId = identity.subject;

    // Generate unique room code (with retry logic)
    let roomCode: string;
    let attempts = 0;
    do {
      roomCode = generateRoomCode();
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", roomCode))
        .first();
      attempts++;
      if (!existing) break;
      if (attempts > 10) {
        throw new Error("Unable to generate unique room code");
      }
    } while (true);

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      code: roomCode,
      hostId: userId,
      settings: {
        ...args.settings,
        regenerationsPerPlayer: 3, // Default from constants
      },
      state: "waiting",
      currentRound: 0,
      createdAt: Date.now(),
    });

    // Add the host as the first player
    await ctx.db.insert("players", {
      roomId,
      userId,
      nickname: "Host", // Will be updated with actual user info
      score: 0,
      regenerationsUsed: 0,
      isHost: true,
      isConnected: true,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    return { roomId, roomCode };
  },
});

// Join a room by code
export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to join a room");
    }
    const userId = identity.subject;

    // Find the room
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.roomCode))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.state !== "waiting") {
      throw new Error("Cannot join room - game already in progress");
    }

    // Check if user is already in the room
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", room._id))
      .first();

    if (existingPlayer) {
      // Update existing player to connected
      await ctx.db.patch(existingPlayer._id, {
        isConnected: true,
        lastSeenAt: Date.now(),
      });
      return { success: true, roomId: room._id };
    }

    // Check room capacity
    const playerCount = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id).eq("isConnected", true))
      .collect();

    if (playerCount.length >= room.settings.maxPlayers) {
      throw new Error("Room is full");
    }

    // Add player to room
    await ctx.db.insert("players", {
      roomId: room._id,
      userId,
      nickname: args.nickname,
      score: 0,
      regenerationsUsed: 0,
      isHost: false,
      isConnected: true,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    return { success: true, roomId: room._id };
  },
});

// Get room by code (for public access)
export const getRoomByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!room) {
      return null;
    }

    // Get connected players
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id).eq("isConnected", true))
      .collect();

    return {
      ...room,
      playerCount: players.length,
      players: players.map(p => ({
        id: p._id,
        nickname: p.nickname,
        score: p.score,
        isHost: p.isHost,
      })),
    };
  },
});

// Get room state (authenticated)
export const getRoomState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }
    const userId = identity.subject;

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify user is in the room
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", args.roomId))
      .first();

    if (!player) {
      throw new Error("User not in room");
    }

    // Get all connected players
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId).eq("isConnected", true))
      .collect();

    // Get current round if exists
    let currentRound = null;
    if (room.currentRound > 0) {
      currentRound = await ctx.db
        .query("rounds")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId).eq("roundNumber", room.currentRound))
        .first();
    }

    return {
      ...room,
      players: players.map(p => ({
        id: p._id,
        userId: p.userId,
        nickname: p.nickname,
        score: p.score,
        isHost: p.isHost,
        regenerationsUsed: p.regenerationsUsed,
      })),
      currentPlayer: player,
      currentRound,
    };
  },
});

// Leave room
export const leaveRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }
    const userId = identity.subject;

    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", args.roomId))
      .first();

    if (!player) {
      throw new Error("User not in room");
    }

    // Mark player as disconnected
    await ctx.db.patch(player._id, {
      isConnected: false,
      lastSeenAt: Date.now(),
    });

    // If host left and game hasn't started, delete room
    if (player.isHost) {
      const room = await ctx.db.get(args.roomId);
      if (room && room.state === "waiting") {
        // Delete all players
        const players = await ctx.db
          .query("players")
          .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
          .collect();
        
        for (const p of players) {
          await ctx.db.delete(p._id);
        }
        
        // Delete room
        await ctx.db.delete(args.roomId);
      }
    }

    return { success: true };
  },
});

// Get public rooms
export const getPublicRooms = query({
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_public", (q) => q.eq("settings.isPublic", true).eq("state", "waiting"))
      .order("desc")
      .take(20);

    // Get player counts for each room
    const roomsWithPlayers = await Promise.all(
      rooms.map(async (room) => {
        const playerCount = await ctx.db
          .query("players")
          .withIndex("by_room", (q) => q.eq("roomId", room._id).eq("isConnected", true))
          .collect();

        return {
          ...room,
          playerCount: playerCount.length,
        };
      })
    );

    return roomsWithPlayers;
  },
});