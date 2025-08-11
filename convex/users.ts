import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Mutation to ensure user exists (creates or updates)
export const ensureUser = mutation({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      username: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      gamesPlayed: v.number(),
      gamesWon: v.number(),
      totalScore: v.number(),
      createdAt: v.number(),
      lastSeenAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existingUser) {
      // Update last seen
      await ctx.db.patch(existingUser._id, {
        lastSeenAt: Date.now(),
      });
      return existingUser;
    }

    // Create new user from JWT identity
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email || "",
      username: identity.nickname || identity.name || identity.email?.split("@")[0] || "User",
      imageUrl: identity.pictureUrl,
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    const newUser = await ctx.db.get(userId);
    return newUser;
  },
});

// Get current user (read-only)
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      username: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      gamesPlayed: v.number(),
      gamesWon: v.number(),
      totalScore: v.number(),
      createdAt: v.number(),
      lastSeenAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Just read the user, don't create
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      username: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      gamesPlayed: v.number(),
      gamesWon: v.number(),
      totalScore: v.number(),
      createdAt: v.number(),
      lastSeenAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});

// Get user stats
export const getUserStats = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  returns: v.union(
    v.object({
      gamesPlayed: v.number(),
      gamesWon: v.number(),
      totalScore: v.number(),
      winRate: v.number(),
      averageScore: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.userId) {
      return null;
    }

    let user;
    if (args.userId) {
      user = await ctx.db.get(args.userId);
    } else {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity!.subject))
        .first();
    }

    if (!user) {
      return null;
    }

    return {
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      totalScore: user.totalScore,
      winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed) * 100 : 0,
      averageScore: user.gamesPlayed > 0 ? user.totalScore / user.gamesPlayed : 0,
    };
  },
});
