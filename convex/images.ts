import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// Generate placeholder images for prompts (Feature 2 - before AI integration)
export const generatePlaceholderImages = mutation({
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

    if (round.state !== "prompting") {
      throw new Error("Round is not in prompting phase");
    }

    // Get all prompts for this round
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    if (prompts.length === 0) {
      throw new Error("No prompts to generate images for");
    }

    // Update round state to generating
    await ctx.db.patch(args.roundId, {
      state: "generating",
    });

    // Generate placeholder "images" for each prompt
    const placeholderColors = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#96CEB4", // Green
      "#FFEAA7", // Yellow
      "#DDA0DD", // Plum
      "#FFB347", // Orange
      "#98D8C8", // Mint
    ];

    const generatedImages = [];
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const color = placeholderColors[i % placeholderColors.length];
      
      // Create a data URL for a colored rectangle (placeholder)
      const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="${color}"/>
        <text x="256" y="220" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" font-weight="bold">Generated Image</text>
        <text x="256" y="260" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">Prompt: "${prompt.text.substring(0, 30)}${prompt.text.length > 30 ? '...' : ''}"</text>
        <text x="256" y="300" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">Placeholder Image</text>
      </svg>`;
      
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

      // Create generated image record
      const imageId = await ctx.db.insert("generatedImages", {
        roundId: args.roundId,
        playerId: prompt.playerId,
        promptId: prompt._id,
        prompt: prompt.text,
        imageStorageId: "placeholder" as any, // Will be replaced in Feature 3
        imageUrl: dataUrl,
        generationTimeMs: Math.random() * 2000 + 1000, // Simulate 1-3 second generation
        isWinner: false,
        regenerationNumber: 0,
        createdAt: Date.now(),
      });

      generatedImages.push(imageId);
    }

    // After all images are "generated", move to voting phase
    await ctx.db.patch(args.roundId, {
      state: "voting",
    });

    return { success: true, imageIds: generatedImages };
  },
});

// Get images for a round
export const getImagesForRound = query({
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

    const images = await ctx.db
      .query("generatedImages")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    // Get player info for each image
    const imagesWithPlayers = await Promise.all(
      images.map(async (image) => {
        const imagePlayer = await ctx.db.get(image.playerId);
        return {
          ...image,
          player: imagePlayer ? {
            id: imagePlayer._id,
            nickname: imagePlayer.nickname,
          } : null,
        };
      })
    );

    return imagesWithPlayers;
  },
});

// Regenerate image (placeholder for Feature 3)
export const regenerateImage = mutation({
  args: { 
    roundId: v.id("rounds"),
    promptId: v.id("prompts"),
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

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || prompt.roundId !== args.roundId) {
      throw new Error("Invalid prompt for this round");
    }

    // Find player
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", round.roomId))
      .first();

    if (!player || player._id !== prompt.playerId) {
      throw new Error("Can only regenerate your own images");
    }

    // Check regeneration limit
    if (player.regenerationsUsed >= 3) { // From constants
      throw new Error("Regeneration limit reached");
    }

    // Find existing image
    const existingImage = await ctx.db
      .query("generatedImages")
      .withIndex("by_player_round", (q) => q.eq("playerId", player._id).eq("roundId", args.roundId))
      .first();

    if (!existingImage) {
      throw new Error("No existing image to regenerate");
    }

    // Create new placeholder with different color
    const newColors = ["#E74C3C", "#8E44AD", "#3498DB", "#2ECC71", "#F39C12", "#E67E22"];
    const color = newColors[player.regenerationsUsed % newColors.length];
    
    const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="${color}"/>
      <text x="256" y="200" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" font-weight="bold">Regenerated Image</text>
      <text x="256" y="240" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">Prompt: "${prompt.text.substring(0, 30)}${prompt.text.length > 30 ? '...' : ''}"</text>
      <text x="256" y="280" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">Regeneration #${player.regenerationsUsed + 1}</text>
      <text x="256" y="320" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">Placeholder Image</text>
    </svg>`;
    
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    // Update existing image
    await ctx.db.patch(existingImage._id, {
      imageUrl: dataUrl,
      regenerationNumber: existingImage.regenerationNumber + 1,
      generationTimeMs: Math.random() * 2000 + 1000,
      createdAt: Date.now(),
    });

    // Update player regeneration count
    await ctx.db.patch(player._id, {
      regenerationsUsed: player.regenerationsUsed + 1,
    });

    return { success: true };
  },
});

// Future: This will be replaced with actual DALL-E integration in Feature 3
export const generateAIImage = action({
  args: {
    prompt: v.string(),
    roundId: v.id("rounds"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    // This is a placeholder for Feature 3 - DALL-E integration
    // For now, we'll just call the placeholder function
    
    // In Feature 3, this would:
    // 1. Call OpenAI DALL-E API with args.prompt
    // 2. Store the returned image in Convex file storage
    // 3. Create generatedImages record with real image data
    
    throw new Error("AI image generation not yet implemented - use generatePlaceholderImages for Feature 2");
  },
});

// Get user's image generation statistics
export const getUserImageStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject;

    // Get all user's players
    const players = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId))
      .collect();

    const playerIds = players.map(p => p._id);

    // Count total images generated
    let totalImages = 0;
    let totalRegenerations = 0;

    for (const playerId of playerIds) {
      const images = await ctx.db
        .query("generatedImages")
        .filter((q) => q.eq(q.field("playerId"), playerId))
        .collect();
      
      totalImages += images.length;
      totalRegenerations += images.reduce((sum, img) => sum + img.regenerationNumber, 0);
    }

    return {
      totalImages,
      totalRegenerations,
      playersCount: players.length,
    };
  },
});