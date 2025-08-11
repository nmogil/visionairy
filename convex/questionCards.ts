import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Seed data for question cards
const QUESTION_CARDS = [
  // Easy/Fun Cards
  { text: "A cat wearing a business suit at an important meeting", category: "animals", difficulty: "easy" },
  { text: "A dinosaur trying to use a smartphone", category: "animals", difficulty: "easy" },
  { text: "A penguin hosting a cooking show", category: "animals", difficulty: "easy" },
  { text: "A robot having trouble with technology", category: "technology", difficulty: "easy" },
  { text: "A superhero whose only power is making excellent sandwiches", category: "characters", difficulty: "easy" },
  { text: "A pirate ship sailing through space", category: "adventure", difficulty: "easy" },
  { text: "A medieval knight at a modern coffee shop", category: "characters", difficulty: "easy" },
  { text: "A dragon trying to order pizza online", category: "animals", difficulty: "easy" },
  { text: "An astronaut gardening on Mars", category: "space", difficulty: "easy" },
  { text: "A vampire at the beach wearing sunscreen", category: "characters", difficulty: "easy" },

  // Medium Difficulty
  { text: "The world's most boring superhero saving the day", category: "characters", difficulty: "medium" },
  { text: "A library where the books are trying to escape", category: "fantasy", difficulty: "medium" },
  { text: "A cooking competition between robots and aliens", category: "technology", difficulty: "medium" },
  { text: "An office where everyone is a different mythical creature", category: "fantasy", difficulty: "medium" },
  { text: "A weather forecast delivered by actual weather phenomena", category: "nature", difficulty: "medium" },
  { text: "A gym where the equipment has gone rogue", category: "technology", difficulty: "medium" },
  { text: "A detective story where the criminal is gravity", category: "mystery", difficulty: "medium" },
  { text: "A school where the subjects teach themselves", category: "education", difficulty: "medium" },
  { text: "A restaurant where the food reviews you", category: "food", difficulty: "medium" },
  { text: "A traffic jam in a world where cars are alive", category: "technology", difficulty: "medium" },

  // Creative/Abstract
  { text: "What happens when colors get tired of being themselves", category: "abstract", difficulty: "medium" },
  { text: "A world where gravity works sideways on Tuesdays", category: "abstract", difficulty: "medium" },
  { text: "The emotion 'nostalgia' opening a shop", category: "abstract", difficulty: "hard" },
  { text: "A conversation between Wi-Fi and Bluetooth", category: "technology", difficulty: "medium" },
  { text: "The sound of silence trying to make noise", category: "abstract", difficulty: "hard" },
  { text: "What music looks like when nobody's listening", category: "abstract", difficulty: "hard" },
  { text: "A dance battle between different types of weather", category: "nature", difficulty: "medium" },
  { text: "The internet trying to take a vacation", category: "technology", difficulty: "medium" },
  { text: "A world where shadows lead and people follow", category: "abstract", difficulty: "hard" },
  { text: "Time trying to set an alarm clock", category: "abstract", difficulty: "hard" },

  // Pop Culture & Modern Life
  { text: "A social media influencer in medieval times", category: "modern", difficulty: "medium" },
  { text: "A meme trying to explain itself to confused grandparents", category: "modern", difficulty: "medium" },
  { text: "A video game character on their day off", category: "gaming", difficulty: "easy" },
  { text: "What happens when autocorrect becomes self-aware", category: "technology", difficulty: "medium" },
  { text: "A streaming service for pets only", category: "animals", difficulty: "medium" },
  { text: "A GPS that only gives directions to magical places", category: "fantasy", difficulty: "medium" },
  { text: "A food delivery app in a fantasy realm", category: "fantasy", difficulty: "medium" },
  { text: "A dating app for household appliances", category: "technology", difficulty: "medium" },
  { text: "An unboxing video for something that should never be unboxed", category: "modern", difficulty: "medium" },
  { text: "A tutorial for something completely impossible", category: "modern", difficulty: "medium" },

  // Adventure & Action
  { text: "An epic battle fought entirely with pool noodles", category: "adventure", difficulty: "easy" },
  { text: "A heist movie where thieves steal concepts instead of objects", category: "adventure", difficulty: "hard" },
  { text: "A race where the finish line keeps moving", category: "adventure", difficulty: "medium" },
  { text: "A treasure hunt where X marks the spot of someone's lost keys", category: "adventure", difficulty: "easy" },
  { text: "A spy mission in a world made entirely of jello", category: "adventure", difficulty: "medium" },
  { text: "An escape room that's actually just someone's messy bedroom", category: "adventure", difficulty: "easy" },
  { text: "A quest to find the TV remote in an IKEA store", category: "adventure", difficulty: "medium" },
  { text: "A battle between breakfast cereals for supremacy", category: "food", difficulty: "easy" },
  { text: "A rescue mission where heroes save pizza from being eaten", category: "food", difficulty: "easy" },
  { text: "An adventure where the map is written in emoji", category: "adventure", difficulty: "medium" },

  // Everyday Objects with Personality
  { text: "A stapler having an existential crisis", category: "objects", difficulty: "medium" },
  { text: "Office supplies forming a union", category: "objects", difficulty: "medium" },
  { text: "A pencil trying to write its own story", category: "objects", difficulty: "medium" },
  { text: "Socks plotting their escape from the laundry", category: "objects", difficulty: "easy" },
  { text: "A coffee mug's first day at work", category: "objects", difficulty: "easy" },
  { text: "Headphones trying to untangle themselves", category: "objects", difficulty: "easy" },
  { text: "A calculator trying to solve its own problems", category: "objects", difficulty: "medium" },
  { text: "A door that's tired of being knocked", category: "objects", difficulty: "medium" },
  { text: "Scissors in couples therapy with rock and paper", category: "objects", difficulty: "medium" },
  { text: "A mirror having a bad reflection day", category: "objects", difficulty: "medium" },
];

// Initialize question cards in database
export const seedQuestionCards = mutation({
  handler: async (ctx) => {
    // Check if cards already exist
    const existingCards = await ctx.db.query("questionCards").collect();
    
    if (existingCards.length > 0) {
      return { message: "Question cards already seeded", count: existingCards.length };
    }

    // Insert all question cards
    const insertedIds = [];
    
    for (const card of QUESTION_CARDS) {
      const id = await ctx.db.insert("questionCards", {
        text: card.text,
        category: card.category,
        difficulty: card.difficulty as "easy" | "medium" | "hard",
        isActive: true,
        usageCount: 0,
      });
      insertedIds.push(id);
    }

    return { 
      message: "Successfully seeded question cards", 
      count: insertedIds.length,
      ids: insertedIds 
    };
  },
});

// Get all question cards (admin/debug)
export const getAllQuestionCards = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("questionCards")
      .order("desc")
      .collect();
  },
});

// Get random active question cards
export const getRandomQuestionCards = query({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("questionCards")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Shuffle and return requested count
    const shuffled = cards.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(args.count, shuffled.length));
  },
});

// Toggle question card active status
export const toggleQuestionCard = mutation({
  args: { 
    cardId: v.id("questionCards"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cardId, {
      isActive: args.isActive,
    });
    return { success: true };
  },
});

// Add new question card
export const addQuestionCard = mutation({
  args: {
    text: v.string(),
    category: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
  },
  handler: async (ctx, args) => {
    const cardId = await ctx.db.insert("questionCards", {
      text: args.text,
      category: args.category || "custom",
      difficulty: args.difficulty || "medium",
      isActive: true,
      usageCount: 0,
    });

    return { success: true, cardId };
  },
});

// Get question card stats
export const getQuestionCardStats = query({
  handler: async (ctx) => {
    const allCards = await ctx.db.query("questionCards").collect();
    const activeCards = allCards.filter(card => card.isActive);
    
    const categories = [...new Set(allCards.map(card => card.category))];
    const difficulties = {
      easy: allCards.filter(card => card.difficulty === "easy").length,
      medium: allCards.filter(card => card.difficulty === "medium").length,
      hard: allCards.filter(card => card.difficulty === "hard").length,
    };

    const mostUsed = allCards
      .filter(card => card.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    return {
      total: allCards.length,
      active: activeCards.length,
      categories: categories.map(cat => ({
        name: cat,
        count: allCards.filter(card => card.category === cat).length
      })),
      difficulties,
      mostUsed,
      totalUsage: allCards.reduce((sum, card) => sum + card.usageCount, 0),
    };
  },
});