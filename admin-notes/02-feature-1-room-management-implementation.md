# Feature 1: Room Management & Real-time Integration Implementation

## Overview
**Goal:** Users can create, join, and share rooms with live UI updates  
**Prerequisites:** Feature 0 (Foundation & Core UI System) completed  
**Timeline:** 2-3 days

## Pre-Implementation Checklist
- [ ] Feature 0 completed and verified
- [ ] UI components working with mock data
- [ ] Convex backend deployed with room functions
- [ ] All environment variables configured

## Implementation Tasks

### Task 1: Connect Room Creation to Backend (1 hour)

The room creation logic is already implemented in `components/dashboard/quick-actions.tsx` but needs verification and enhancement.

#### 1.1 Verify Room Creation Mutation
**File:** `components/dashboard/quick-actions.tsx` (already exists, verify this code)

```typescript
const handleCreateRoom = async () => {
  setIsCreating(true);
  try {
    const result = await createRoom({
      settings: {
        maxPlayers: 8,
        roundTimer: 30,
        totalRounds: 10,
        isPublic: false,
      },
    });
    
    router.push(`/room/${result.roomCode}`);
    toast.success("Room created successfully!");
  } catch (error) {
    toast.error("Failed to create room");
    console.error("Room creation error:", error);
  } finally {
    setIsCreating(false);
  }
};
```

#### 1.2 Test Room Creation
**MCP Command to test:**
```bash
# Use Convex MCP to test room creation
mcp_convex_run createRoom '{"settings": {"maxPlayers": 8, "roundTimer": 30, "totalRounds": 10, "isPublic": false}}'
```

### Task 2: Connect Room Lobby to Real-time Backend (3 hours)

#### 2.1 Update Room Lobby Component
**File:** `components/game/room-lobby.tsx`

Replace the mock data queries with real Convex subscriptions:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Crown, Users, Play, Settings, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface Props {
  roomCode: string;
}

export function RoomLobby({ roomCode }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const [nickname, setNickname] = useState(user?.firstName || user?.username || "");
  const [isJoining, setIsJoining] = useState(false);
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  
  // Get room data by code (public access)
  const room = useQuery(api.rooms.getRoomByCode, { code: roomCode });
  
  // Get detailed room state if user is in room (authenticated)
  const roomState = useQuery(
    api.rooms.getRoomState, 
    roomId ? { roomId } : "skip"
  );
  
  const joinRoom = useMutation(api.rooms.joinRoom);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const startGame = useMutation(api.game.startGame);
  
  // Update roomId when room data loads
  useEffect(() => {
    if (room?._id) {
      setRoomId(room._id);
    }
  }, [room]);
  
  // Use roomState if available (more detailed), otherwise use room data
  const displayRoom = roomState || room;
  const isInRoom = roomState?.currentPlayer !== undefined;
  const canStartGame = displayRoom?.players && displayRoom.players.length >= 3;
  const isHost = roomState?.currentPlayer?.isHost || false;

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }
    
    setIsJoining(true);
    try {
      await joinRoom({
        roomCode,
        nickname: nickname.trim(),
      });
      toast.success("Joined room successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    
    try {
      await leaveRoom({ roomId });
      toast.success("Left room");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to leave room");
    }
  };

  const handleStartGame = async () => {
    if (!roomId) return;
    
    try {
      await startGame({ roomId });
      toast.success("Game started!");
      router.push(`/play/${roomId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start game");
    }
  };

  const handleCopyRoomCode = () => {
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Room link copied to clipboard!");
  };

  // Loading state
  if (room === undefined) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading room...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Room not found
  if (room === null) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Room Not Found</p>
              <p className="text-muted-foreground">
                The room code "{roomCode}" doesn't exist or has expired.
              </p>
              <Button onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game already started
  if (displayRoom.state !== "waiting") {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Game In Progress</p>
              <p className="text-muted-foreground">
                This room's game has already started.
              </p>
              {isInRoom && (
                <Button onClick={() => router.push(`/play/${roomId}`)}>
                  Join Game
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Room Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Room {roomCode}</CardTitle>
          <CardDescription>
            AI Image Party Game
          </CardDescription>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRoomCode}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Share Room
            </Button>
            {isInRoom && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeaveRoom}
                className="text-destructive hover:text-destructive"
              >
                Leave Room
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Join Room / Player Status */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isInRoom ? "You're In!" : "Join the Game"}
            </CardTitle>
            <CardDescription>
              {isInRoom 
                ? "Waiting for the host to start the game..."
                : "Enter your nickname to join the room"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isInRoom ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    placeholder="Enter your nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isJoining && nickname.trim()) {
                        handleJoinRoom();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleJoinRoom}
                  disabled={isJoining || !nickname.trim()}
                  className="w-full"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Room"
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Status</span>
                  <Badge variant="secondary">In Room</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Your Nickname</span>
                  <span className="font-medium">{roomState?.currentPlayer?.nickname}</span>
                </div>
                
                {isHost && canStartGame && (
                  <Button 
                    onClick={handleStartGame}
                    className="w-full" 
                    size="lg"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Game
                  </Button>
                )}
                
                {isHost && !canStartGame && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Need at least 3 players to start
                    </p>
                  </div>
                )}
                
                {!isHost && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Waiting for host to start the game
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players ({displayRoom.playerCount || 0}/{displayRoom.settings?.maxPlayers || 8})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayRoom.players?.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    roomState?.currentPlayer?.id === player.id
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/50"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {player.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium">{player.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      Score: {player.score}
                    </p>
                  </div>
                  
                  {player.isHost && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Host
                    </Badge>
                  )}
                </div>
              ))}
              
              {/* Empty slots */}
              {displayRoom.settings && Array.from({ 
                length: displayRoom.settings.maxPlayers - (displayRoom.playerCount || 0)
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-muted-foreground/20"
                >
                  <div className="h-8 w-8 rounded-full bg-muted-foreground/10" />
                  <span className="text-muted-foreground">Waiting for player...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Settings */}
      {displayRoom.settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Game Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Max Players</p>
                <p className="text-xl font-bold">{displayRoom.settings.maxPlayers}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Round Timer</p>
                <p className="text-xl font-bold">{displayRoom.settings.roundTimer}s</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Rounds</p>
                <p className="text-xl font-bold">{displayRoom.settings.totalRounds}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Regenerations</p>
                <p className="text-xl font-bold">{displayRoom.settings.regenerationsPerPlayer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Task 3: Add User Synchronization (2 hours)

#### 3.1 Create User Provider
**File:** `components/app/user-provider.tsx`

```typescript
"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  children: React.ReactNode;
}

export function UserProvider({ children }: Props) {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isLoaded && user) {
      // Sync user data to Convex
      upsertUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        username: user.username || user.firstName || "Player",
        imageUrl: user.imageUrl,
      }).catch(console.error);
    }
  }, [isLoaded, user, upsertUser]);

  return <>{children}</>;
}
```

#### 3.2 Create User Management Functions
**File:** `convex/users.ts`

```typescript
import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();
    
    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        username: args.username,
        imageUrl: args.imageUrl,
        lastSeenAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        username: args.username,
        imageUrl: args.imageUrl,
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        createdAt: now,
        lastSeenAt: now,
      });
    }
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});
```

### Task 4: Add Game State Management Functions (2 hours)

#### 4.1 Update Game Functions
**File:** `convex/game.ts`

```typescript
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

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

    if (room.hostId !== userId) {
      throw new Error("Only the host can start the game");
    }

    if (room.state !== "waiting") {
      throw new Error("Game has already started");
    }

    // Get connected players
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId).eq("isConnected", true))
      .collect();

    if (players.length < 3) {
      throw new Error("Need at least 3 players to start");
    }

    // Update room state
    await ctx.db.patch(args.roomId, {
      state: "playing",
      startedAt: Date.now(),
    });

    // Start first round
    await ctx.scheduler.runAfter(0, internal.game.startNextRound, {
      roomId: args.roomId,
    });

    return { success: true };
  },
});

export const startNextRound = internalMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const nextRoundNumber = room.currentRound + 1;
    
    if (nextRoundNumber > room.settings.totalRounds) {
      // Game is over
      await ctx.db.patch(args.roomId, {
        state: "gameOver",
        endedAt: Date.now(),
      });
      return;
    }

    // Get active players
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId).eq("isConnected", true))
      .collect();

    if (players.length === 0) {
      throw new Error("No active players");
    }

    // Select Card Czar (rotate through players)
    const cardCzarIndex = (nextRoundNumber - 1) % players.length;
    const cardCzar = players[cardCzarIndex];

    // Get a random question card
    const questionCards = await ctx.db
      .query("questionCards")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    if (questionCards.length === 0) {
      throw new Error("No question cards available");
    }
    
    const randomCard = questionCards[Math.floor(Math.random() * questionCards.length)];

    // Create the round
    const roundId = await ctx.db.insert("rounds", {
      roomId: args.roomId,
      roundNumber: nextRoundNumber,
      questionCardId: randomCard._id,
      cardCzarId: cardCzar._id,
      state: "prompting",
      promptDeadline: Date.now() + (room.settings.roundTimer * 1000),
      startedAt: Date.now(),
    });

    // Update room
    await ctx.db.patch(args.roomId, {
      currentRound: nextRoundNumber,
      state: "roundActive",
    });

    // Schedule prompt deadline
    await ctx.scheduler.runAt(
      new Date(Date.now() + (room.settings.roundTimer * 1000)),
      internal.game.endPromptPhase,
      { roundId }
    );

    return { roundId, nextRoundNumber };
  },
});

export const endPromptPhase = internalMutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.state !== "prompting") {
      return; // Round already moved on
    }

    // Update round to generating phase
    await ctx.db.patch(args.roundId, {
      state: "generating",
    });

    // In later features, this will trigger AI image generation
    // For now, just move to voting after a delay
    await ctx.scheduler.runAfter(5000, internal.game.startVotingPhase, {
      roundId: args.roundId,
    });
  },
});

export const startVotingPhase = internalMutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.state !== "generating") {
      return;
    }

    await ctx.db.patch(args.roundId, {
      state: "voting",
    });

    // Schedule voting deadline (30 seconds)
    await ctx.scheduler.runAfter(30000, internal.game.endVotingPhase, {
      roundId: args.roundId,
    });
  },
});

export const endVotingPhase = internalMutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.state !== "voting") {
      return;
    }

    await ctx.db.patch(args.roundId, {
      state: "complete",
      completedAt: Date.now(),
    });

    // Start next round after 5 seconds
    await ctx.scheduler.runAfter(5000, internal.game.startNextRound, {
      roomId: round.roomId,
    });
  },
});

export const getCurrentRound = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.currentRound === 0) {
      return null;
    }

    const round = await ctx.db
      .query("rounds")
      .withIndex("by_room", (q) => 
        q.eq("roomId", args.roomId).eq("roundNumber", room.currentRound)
      )
      .first();

    if (!round) {
      return null;
    }

    // Get question card
    const questionCard = await ctx.db.get(round.questionCardId);
    
    // Get card czar
    const cardCzar = await ctx.db.get(round.cardCzarId);
    
    return {
      ...round,
      questionCard: questionCard?.text || "Loading question...",
      cardCzar: cardCzar?.nickname || "Unknown",
      timeRemaining: Math.max(0, Math.floor((round.promptDeadline - Date.now()) / 1000)),
    };
  },
});
```

### Task 5: Add Presence and Real-time Updates (2 hours)

#### 5.1 Add Presence Tracking
**File:** `convex/presence.ts`

```typescript
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const updatePresence = mutation({
  args: {
    roomId: v.id("rooms"),
    status: v.object({
      isTyping: v.boolean(),
      hasSubmitted: v.boolean(),
      lastActivity: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated");
    }
    const userId = identity.subject;

    // Get player
    const player = await ctx.db
      .query("players")
      .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("roomId", args.roomId))
      .first();

    if (!player) {
      throw new Error("Player not in room");
    }

    // Update or create presence
    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("roomId", args.roomId))
      .first();

    const presenceData = {
      roomId: args.roomId,
      userId,
      playerId: player._id,
      status: args.status,
      expiresAt: Date.now() + 60000, // Expire after 1 minute
    };

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, presenceData);
    } else {
      await ctx.db.insert("presence", presenceData);
    }

    return { success: true };
  },
});

export const getPresence = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get active presence (not expired)
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId).gt("expiresAt", now))
      .collect();

    return presence;
  },
});

// Cleanup expired presence records
export const cleanupExpiredPresence = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredPresence = await ctx.db
      .query("presence")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const presence of expiredPresence) {
      await ctx.db.delete(presence._id);
    }
  },
});
```

#### 5.2 Add Cron Job for Cleanup
**File:** `convex/crons.ts`

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired presence every minute
crons.interval(
  "cleanup expired presence",
  { minutes: 1 },
  internal.presence.cleanupExpiredPresence,
  {}
);

export default crons;
```

### Task 6: Add Error Handling and Loading States (1 hour)

#### 6.1 Update Room Page with Error Handling
**File:** `app/room/[code]/page.tsx`

```typescript
import { notFound } from "next/navigation";
import { RoomLobby } from "@/components/game/room-lobby";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  params: { code: string };
}

export default async function RoomPage({ params }: Props) {
  const { code } = params;
  
  // Validate room code format
  if (!/^[A-Z]{6}$/.test(code)) {
    notFound();
  }

  try {
    // Get room data (this will be null if room doesn't exist)
    const room = await fetchQuery(api.rooms.getRoomByCode, { code });
    
    if (!room) {
      notFound();
    }

    return <RoomLobby roomCode={code} />;
  } catch (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-lg font-medium">Something went wrong</p>
              <p className="text-muted-foreground">
                Unable to load room. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export async function generateMetadata({ params }: Props) {
  const { code } = params;
  
  try {
    const room = await fetchQuery(api.rooms.getRoomByCode, { code });
    
    return {
      title: room ? `Join Room ${code} - Visionairy` : `Room ${code} - Visionairy`,
      description: `Join the AI image party game in room ${code}!`,
      openGraph: {
        title: `Join Room ${code}`,
        description: "Join the AI image party game!",
        images: [`/api/og?roomCode=${code}`],
      },
    };
  } catch {
    return {
      title: `Room ${code} - Visionairy`,
      description: "AI Image Party Game",
    };
  }
}
```

## Testing and Verification

### Task 7: Testing with MCP Commands (1 hour)

#### 7.1 Test Room Creation
Use MCP commands to test the implementation:

```bash
# Test room creation
mcp_convex_run api.rooms.createRoom '{"settings": {"maxPlayers": 8, "roundTimer": 30, "totalRounds": 10, "isPublic": false}}'

# Test room joining
mcp_convex_run api.rooms.joinRoom '{"roomCode": "ABCDEF", "nickname": "TestPlayer"}'

# Test getting room by code
mcp_convex_run api.rooms.getRoomByCode '{"code": "ABCDEF"}'

# Test user creation
mcp_convex_run api.users.upsertUser '{"clerkId": "test_123", "email": "test@example.com", "username": "TestUser"}'
```

#### 7.2 Test Room State Updates
```bash
# Get room state
mcp_convex_run api.rooms.getRoomState '{"roomId": "room_id_here"}'

# Start game
mcp_convex_run api.game.startGame '{"roomId": "room_id_here"}'

# Get current round
mcp_convex_run api.game.getCurrentRound '{"roomId": "room_id_here"}'
```

### Task 8: End-to-End Testing (1 hour)

#### 8.1 Manual Testing Checklist
- [ ] Create room from dashboard
- [ ] Copy room link and open in incognito window
- [ ] Join room with different user
- [ ] Verify real-time player list updates
- [ ] Test leaving and rejoining room
- [ ] Test starting game with sufficient players
- [ ] Verify error handling for invalid room codes
- [ ] Test presence updates and cleanup

#### 8.2 Performance Testing
- [ ] Verify room creation takes <2 seconds
- [ ] Verify real-time updates appear within 1 second
- [ ] Test with multiple concurrent users
- [ ] Check for memory leaks in long-running sessions

## Success Criteria
- [ ] Room creation works with real backend
- [ ] Room joining with real-time player updates
- [ ] User data synced from Clerk to Convex
- [ ] Game state management functions working
- [ ] Presence tracking for real-time updates
- [ ] Error handling for edge cases
- [ ] All TypeScript errors resolved
- [ ] Performance meets requirements

## Troubleshooting Guide

### Common Issues:

1. **Room creation fails:**
   - Check Convex deployment status
   - Verify environment variables
   - Check authentication tokens

2. **Real-time updates not working:**
   - Verify Convex subscriptions are properly set up
   - Check browser console for errors
   - Confirm WebSocket connections

3. **User sync issues:**
   - Verify Clerk webhook configuration
   - Check Convex auth configuration
   - Ensure user provider is properly wrapped

## Next Steps
Once Feature 1 is complete and verified, the foundation for real-time multiplayer gaming is established. The next features would focus on:
- Complete game flow implementation
- AI image generation integration
- Advanced UI polish and animations
