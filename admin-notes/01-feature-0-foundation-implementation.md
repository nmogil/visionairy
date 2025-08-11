# Feature 0: Foundation & Core UI System Implementation

## Overview
**Goal:** Complete UI foundation with visual game components working with mock data  
**Status:** Foundation exists but needs UI components and layouts implemented  
**Timeline:** 2-3 days

## Pre-Implementation Checklist
- [ ] Completed `00-setup-verification.md`
- [ ] All environment variables configured
- [ ] Convex deployment active with schema
- [ ] Authentication working end-to-end

## Implementation Tasks

### Task 1: Create App Layout Structure (2 hours)

#### 1.1 App Layout with Navigation
**File:** `app/(app)/layout.tsx`

Create the main app layout with navigation:

```typescript
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AppNavigation } from "@/components/app/app-navigation";
import { UserProvider } from "@/components/app/user-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <UserProvider>
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
```

#### 1.2 Navigation Component
**File:** `components/app/app-navigation.tsx`

```typescript
"use client";

import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Gamepad2, Home, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNavigation() {
  const pathname = usePathname();
  
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Rooms", href: "/rooms", icon: Users },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Visionairy</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </div>
      </div>
    </nav>
  );
}
```

### Task 2: Create User Dashboard (3 hours)

#### 2.1 Dashboard Page
**File:** `app/(app)/dashboard/page.tsx`

```typescript
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentGames } from "@/components/dashboard/recent-games";
import { UserStats } from "@/components/dashboard/user-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <QuickActions />
          <Suspense fallback={<Skeleton className="h-64" />}>
            <RecentGames />
          </Suspense>
        </div>
        
        <div>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <UserStats />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 Dashboard Components
**File:** `components/dashboard/dashboard-header.tsx`

```typescript
"use client";

import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeader() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <Skeleton className="h-12 w-64" />;
  }

  const name = user?.firstName || user?.username || "Player";
  const timeOfDay = getTimeOfDay();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        {timeOfDay}, {name}!
      </h1>
      <p className="text-muted-foreground">
        Ready to create some amazing AI art?
      </p>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
```

**File:** `components/dashboard/quick-actions.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Gamepad2, Users, Zap } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function QuickActions() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const createRoom = useMutation(api.rooms.createRoom);

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
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.length === 6) {
      router.push(`/room/${roomCode.toUpperCase()}`);
    } else {
      toast.error("Please enter a valid 6-character room code");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Start playing in seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="w-full"
          size="lg"
        >
          <Gamepad2 className="mr-2 h-4 w-4" />
          {isCreating ? "Creating..." : "Create New Room"}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="room-code">Join with Room Code</Label>
          <div className="flex gap-2">
            <Input
              id="room-code"
              placeholder="Enter 6-letter code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center font-mono text-lg"
            />
            <Button
              onClick={handleJoinRoom}
              disabled={roomCode.length !== 6}
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              Join
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 3: Create Room Lobby UI (4 hours)

#### 3.1 Room Lobby Page
**File:** `app/room/[code]/page.tsx`

```typescript
import { notFound } from "next/navigation";
import { RoomLobby } from "@/components/game/room-lobby";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

interface Props {
  params: { code: string };
}

export default async function RoomPage({ params }: Props) {
  const { code } = params;
  
  // Validate room code format
  if (!/^[A-Z]{6}$/.test(code)) {
    notFound();
  }

  // Get room data (this will be null if room doesn't exist)
  const room = await fetchQuery(api.rooms.getRoomByCode, { code });
  
  if (!room) {
    notFound();
  }

  return <RoomLobby roomCode={code} />;
}

export async function generateMetadata({ params }: Props) {
  const { code } = params;
  
  return {
    title: `Join Room ${code} - Visionairy`,
    description: `Join the AI image party game in room ${code}!`,
    openGraph: {
      title: `Join Room ${code}`,
      description: "Join the AI image party game!",
      images: [`/api/og?roomCode=${code}`],
    },
  };
}
```

#### 3.2 Room Lobby Component
**File:** `components/game/room-lobby.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Crown, Users, Play, Settings } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface Props {
  roomCode: string;
}

export function RoomLobby({ roomCode }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const [nickname, setNickname] = useState(user?.firstName || user?.username || "");
  const [isJoining, setIsJoining] = useState(false);
  
  const room = useQuery(api.rooms.getRoomByCode, { code: roomCode });
  const joinRoom = useMutation(api.rooms.joinRoom);
  
  const isInRoom = room?.players?.some(p => p.userId === user?.id);
  const canStartGame = room?.players && room.players.length >= 3;
  const isHost = room?.players?.find(p => p.userId === user?.id)?.isHost;

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

  const handleCopyRoomCode = () => {
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Room link copied to clipboard!");
  };

  if (!room) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Loading room...</p>
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
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRoomCode}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Share Room
            </Button>
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
                  />
                </div>
                <Button
                  onClick={handleJoinRoom}
                  disabled={isJoining || !nickname.trim()}
                  className="w-full"
                >
                  {isJoining ? "Joining..." : "Join Room"}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Status</span>
                  <Badge variant="secondary">In Room</Badge>
                </div>
                
                {isHost && canStartGame && (
                  <Button className="w-full" size="lg">
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players ({room.playerCount}/{room.settings.maxPlayers})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {room.players?.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
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
              {Array.from({ 
                length: room.settings.maxPlayers - room.playerCount 
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
              <p className="text-xl font-bold">{room.settings.maxPlayers}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Round Timer</p>
              <p className="text-xl font-bold">{room.settings.roundTimer}s</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Rounds</p>
              <p className="text-xl font-bold">{room.settings.totalRounds}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Regenerations</p>
              <p className="text-xl font-bold">{room.settings.regenerationsPerPlayer}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 4: Create Game Interface with Mock Data (4 hours)

#### 4.1 Game Page
**File:** `app/play/[roomId]/page.tsx`

```typescript
import { auth } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import { GameInterface } from "@/components/game/game-interface";

interface Props {
  params: { roomId: string };
}

export default async function GamePage({ params }: Props) {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // For now, just render the game interface
  // In later features, we'll validate the room exists and user is in it
  
  return <GameInterface roomId={params.roomId} />;
}
```

#### 4.2 Game Interface Component
**File:** `components/game/game-interface.tsx`

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Crown, Image, Vote } from "lucide-react";
import { PromptSubmission } from "./prompt-submission";
import { ImageGallery } from "./image-gallery";
import { VotingInterface } from "./voting-interface";
import { GameResults } from "./game-results";

interface Props {
  roomId: string;
}

// Mock data for testing
const mockGameState = {
  currentRound: 1,
  totalRounds: 10,
  phase: "prompting" as const, // "prompting" | "generating" | "voting" | "results"
  timeRemaining: 25,
  questionCard: "A cat wearing a business suit at an important meeting",
  players: [
    { id: "1", nickname: "Alice", score: 0, isCardCzar: true, hasSubmitted: false },
    { id: "2", nickname: "Bob", score: 0, isCardCzar: false, hasSubmitted: true },
    { id: "3", nickname: "Charlie", score: 1, isCardCzar: false, hasSubmitted: false },
    { id: "4", nickname: "Dana", score: 0, isCardCzar: false, hasSubmitted: true },
  ],
  currentPlayer: { id: "1", nickname: "Alice", isCardCzar: true },
};

const mockImages = [
  {
    id: "1",
    playerId: "2",
    playerName: "Bob",
    prompt: "A serious tabby cat in a three-piece suit sitting at a boardroom table",
    imageUrl: "https://picsum.photos/400/400?random=1",
    isWinner: false,
  },
  {
    id: "2", 
    playerId: "4",
    playerName: "Dana",
    prompt: "An orange cat wearing glasses and a tie, presenting a PowerPoint",
    imageUrl: "https://picsum.photos/400/400?random=2",
    isWinner: false,
  },
];

export function GameInterface({ roomId }: Props) {
  const [gameState, setGameState] = useState(mockGameState);
  const [images, setImages] = useState(mockImages);
  
  const handlePhaseChange = (newPhase: typeof gameState.phase) => {
    setGameState(prev => ({ ...prev, phase: newPhase }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                Round {gameState.currentRound} of {gameState.totalRounds}
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                {gameState.questionCard}
              </CardDescription>
            </div>
            
            <div className="text-right space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">
                  {Math.floor(gameState.timeRemaining / 60)}:
                  {(gameState.timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Badge variant={
                gameState.phase === "prompting" ? "default" :
                gameState.phase === "generating" ? "secondary" :
                gameState.phase === "voting" ? "destructive" : "outline"
              }>
                {gameState.phase === "prompting" && "Submit Prompts"}
                {gameState.phase === "generating" && "Generating Images"}
                {gameState.phase === "voting" && "Voting Time"}
                {gameState.phase === "results" && "Round Results"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Players Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  player.isCardCzar 
                    ? "bg-primary/10 border border-primary/20" 
                    : "bg-muted/50"
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {player.nickname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.nickname}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Score: {player.score}
                    </span>
                    {player.isCardCzar && (
                      <Crown className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </div>
                
                {gameState.phase === "prompting" && (
                  <div className="text-right">
                    {player.hasSubmitted ? (
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        ...
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Game Content */}
      {gameState.phase === "prompting" && (
        <PromptSubmission
          questionCard={gameState.questionCard}
          isCardCzar={gameState.currentPlayer.isCardCzar}
          onSubmit={(prompt) => {
            console.log("Submitted prompt:", prompt);
            // In real implementation, this would call Convex mutation
            handlePhaseChange("generating");
          }}
        />
      )}

      {gameState.phase === "generating" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Generating Images...
            </CardTitle>
            <CardDescription>
              Our AI is creating amazing images from your prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">This may take up to 10 seconds</p>
              <Button 
                onClick={() => handlePhaseChange("voting")}
                variant="outline"
              >
                Skip to Voting (Demo)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {gameState.phase === "voting" && (
        <div className="space-y-6">
          <ImageGallery images={images} />
          <VotingInterface
            images={images}
            isCardCzar={gameState.currentPlayer.isCardCzar}
            onVote={(imageId) => {
              console.log("Voted for image:", imageId);
              handlePhaseChange("results");
            }}
          />
        </div>
      )}

      {gameState.phase === "results" && (
        <GameResults
          winner={images[0]}
          allImages={images}
          onNextRound={() => {
            setGameState(prev => ({
              ...prev,
              currentRound: prev.currentRound + 1,
              phase: "prompting",
              timeRemaining: 30,
            }));
          }}
        />
      )}

      {/* Debug Controls (remove in production) */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Debug Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePhaseChange("prompting")}
            >
              Prompting
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePhaseChange("generating")}
            >
              Generating
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePhaseChange("voting")}
            >
              Voting
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePhaseChange("results")}
            >
              Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 5: Create Game Sub-Components (3 hours)

Create the remaining game components in `components/game/`:

- `prompt-submission.tsx`
- `image-gallery.tsx` 
- `voting-interface.tsx`
- `game-results.tsx`

[Components implementations would be detailed here but truncated for length]

## Verification Steps

After implementing each task:

1. **Test Navigation:** 
   - Navigate between dashboard, rooms
   - Verify authentication redirects work

2. **Test Room Creation:**
   - Create room from dashboard
   - Verify room code generation
   - Test room sharing functionality

3. **Test Room Lobby:**
   - Join room with code
   - Verify player list updates
   - Test nickname validation

4. **Test Game Interface:**
   - Navigate through all game phases
   - Verify UI components render correctly
   - Test responsive design

5. **Visual QA:**
   - All components use consistent styling
   - Loading states work properly
   - Error messages display correctly
   - Mobile responsiveness verified

## Success Criteria
- [ ] Complete app navigation working
- [ ] Dashboard with quick actions functional
- [ ] Room creation and joining working
- [ ] Room lobby displays players and settings
- [ ] Game interface shows all phases with mock data
- [ ] All UI components responsive and polished
- [ ] No TypeScript errors
- [ ] All pages load within 3 seconds

## Next Steps
Once Feature 0 is complete and verified, proceed to `02-feature-1-room-management-implementation.md` to connect the UI to real-time Convex backend.
