import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Start a game (host only)
export const startGame = mutation({
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

    // Verify user is the host
    const hostPlayer = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", args.roomId))
      .first();

    if (!hostPlayer || !hostPlayer.isHost) {
      throw new Error("Only the host can start the game");
    }

    if (room.state !== "waiting") {
      throw new Error("Game already started or finished");
    }

    // Check minimum players
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId).eq("isConnected", true))
      .collect();

    if (players.length < 3) {
      throw new Error("Need at least 3 players to start");
    }

    // Get a random question card
    const questionCards = await ctx.db
      .query("questionCards")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (questionCards.length === 0) {
      throw new Error("No question cards available");
    }

    const randomCard = questionCards[Math.floor(Math.random() * questionCards.length)];

    // Update room state
    await ctx.db.patch(args.roomId, {
      state: "playing",
      startedAt: Date.now(),
      currentRound: 1,
    });

    // Create first round
    const roundId = await ctx.db.insert("rounds", {
      roomId: args.roomId,
      roundNumber: 1,
      questionCardId: randomCard._id,
      cardCzarId: players[0]._id, // First player is Card Czar
      state: "prompting",
      promptDeadline: Date.now() + room.settings.roundTimer * 1000,
      startedAt: Date.now(),
    });

    // Update question card usage
    await ctx.db.patch(randomCard._id, {
      usageCount: randomCard.usageCount + 1,
    });

    return { success: true, roundId };
  },
});

// Submit a prompt for the current round
export const submitPrompt = mutation({
  args: {
    roundId: v.id("rounds"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }
    const userId = identity.subject;

    const round = await ctx.db.get(args.roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    if (round.state !== "prompting") {
      throw new Error("Round is not in prompting phase");
    }

    // Check deadline
    if (Date.now() > round.promptDeadline) {
      throw new Error("Prompt deadline has passed");
    }

    // Validate prompt length
    if (args.prompt.length === 0 || args.prompt.length > 200) {
      throw new Error("Prompt must be between 1 and 200 characters");
    }

    // Find player
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", round.roomId))
      .first();

    if (!player) {
      throw new Error("Player not found in room");
    }

    // Card Czar cannot submit prompts
    if (player._id === round.cardCzarId) {
      throw new Error("Card Czar cannot submit prompts");
    }

    // Check if already submitted
    const existingPrompt = await ctx.db
      .query("prompts")
      .withIndex("by_player", (q) => q.eq("playerId", player._id).eq("roundId", args.roundId))
      .first();

    if (existingPrompt) {
      throw new Error("Prompt already submitted for this round");
    }

    // Create prompt
    const promptId = await ctx.db.insert("prompts", {
      roundId: args.roundId,
      playerId: player._id,
      text: args.prompt,
      submittedAt: Date.now(),
    });

    return { success: true, promptId };
  },
});

// Get current round state
export const getRoundState = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }
    const userId = identity.subject;

    const round = await ctx.db.get(args.roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    // Verify user is in the room
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", round.roomId))
      .first();

    if (!player) {
      throw new Error("User not in room");
    }

    // Get question card
    const questionCard = await ctx.db.get(round.questionCardId);
    
    // Get card czar
    const cardCzar = await ctx.db.get(round.cardCzarId);
    
    // Get all prompts
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    // Get all players in room
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId).eq("isConnected", true))
      .collect();

    // Get images if in voting phase
    let images: any[] = [];
    if (round.state === "voting" || round.state === "complete") {
      images = await ctx.db
        .query("generatedImages")
        .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
        .collect();
    }

    return {
      ...round,
      questionCard,
      cardCzar: cardCzar ? {
        id: cardCzar._id,
        nickname: cardCzar.nickname,
      } : null,
      prompts: prompts.map(p => ({
        id: p._id,
        playerId: p.playerId,
        text: p.text,
        submittedAt: p.submittedAt,
      })),
      players: players.map(p => ({
        id: p._id,
        nickname: p.nickname,
        score: p.score,
        isHost: p.isHost,
      })),
      images,
      currentPlayer: player,
      isCardCzar: player._id === round.cardCzarId,
      hasSubmittedPrompt: prompts.some(p => p.playerId === player._id),
      timeRemaining: Math.max(0, round.promptDeadline - Date.now()),
    };
  },
});

// Submit vote (Card Czar only)
export const submitVote = mutation({
  args: {
    roundId: v.id("rounds"),
    winnerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }
    const userId = identity.subject;

    const round = await ctx.db.get(args.roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    if (round.state !== "voting") {
      throw new Error("Round is not in voting phase");
    }

    // Verify user is Card Czar
    const cardCzar = await ctx.db.get(round.cardCzarId);
    if (!cardCzar || cardCzar.userId !== userId) {
      throw new Error("Only Card Czar can vote");
    }

    // Verify winner is valid player
    const winner = await ctx.db.get(args.winnerId);
    if (!winner || winner.roomId !== round.roomId) {
      throw new Error("Invalid winner selection");
    }

    // Update round
    await ctx.db.patch(args.roundId, {
      winnerId: args.winnerId,
      state: "complete",
      completedAt: Date.now(),
    });

    // Award point to winner
    await ctx.db.patch(args.winnerId, {
      score: winner.score + 1,
    });

    // Mark winning image
    const winningImage = await ctx.db
      .query("generatedImages")
      .withIndex("by_player_round", (q) => q.eq("playerId", args.winnerId).eq("roundId", args.roundId))
      .first();

    if (winningImage) {
      await ctx.db.patch(winningImage._id, {
        isWinner: true,
      });
    }

    // Check if game should end
    const room = await ctx.db.get(round.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (round.roundNumber >= room.settings.totalRounds) {
      // Game over
      await ctx.db.patch(round.roomId, {
        state: "gameOver",
        endedAt: Date.now(),
      });

      // Create game stats
      const players = await ctx.db
        .query("players")
        .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
        .collect();

      const images = await ctx.db
        .query("generatedImages")
        .filter((q) => q.eq(q.field("roundId"), args.roundId))
        .collect();

      await ctx.db.insert("gameStats", {
        roomId: round.roomId,
        totalPlayers: players.length,
        totalRounds: round.roundNumber,
        averageGenerationTime: images.reduce((sum, img) => sum + img.generationTimeMs, 0) / Math.max(1, images.length),
        totalRegenerations: players.reduce((sum, p) => sum + p.regenerationsUsed, 0),
        completedAt: Date.now(),
      });
    } else {
      // Start next round
      await startNextRound(ctx, round.roomId, round.roundNumber + 1);
    }

    return { success: true };
  },
});

// Helper function to start next round
async function startNextRound(ctx: any, roomId: any, roundNumber: number) {
  // Get players
  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q: any) => q.eq("roomId", roomId).eq("isConnected", true))
    .collect();

  if (players.length === 0) return;

  // Get room settings
  const room = await ctx.db.get(roomId);
  if (!room) return;

  // Select next Card Czar (rotate)
  const nextCzarIndex = (roundNumber - 1) % players.length;
  const nextCardCzar = players[nextCzarIndex];

  // Get random question card
  const questionCards = await ctx.db
    .query("questionCards")
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();

  if (questionCards.length === 0) return;

  const randomCard = questionCards[Math.floor(Math.random() * questionCards.length)];

  // Update room
  await ctx.db.patch(roomId, {
    currentRound: roundNumber,
    state: "playing",
  });

  // Create new round
  const roundId = await ctx.db.insert("rounds", {
    roomId,
    roundNumber,
    questionCardId: randomCard._id,
    cardCzarId: nextCardCzar._id,
    state: "prompting",
    promptDeadline: Date.now() + room.settings.roundTimer * 1000,
    startedAt: Date.now(),
  });

  // Update question card usage
  await ctx.db.patch(randomCard._id, {
    usageCount: randomCard.usageCount + 1,
  });

  return roundId;
}

// Force advance round (for testing or stuck states)
export const advanceRound = mutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }
    const userId = identity.subject;

    const round = await ctx.db.get(args.roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    // Verify user is host
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", round.roomId))
      .first();

    if (!player || !player.isHost) {
      throw new Error("Only host can force advance round");
    }

    // Advance to next state
    if (round.state === "prompting") {
      await ctx.db.patch(args.roundId, {
        state: "generating",
      });
    } else if (round.state === "generating") {
      await ctx.db.patch(args.roundId, {
        state: "voting",
      });
    }

    return { success: true };
  },
});