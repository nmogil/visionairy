import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Crown, Timer, Send, Sparkles } from "lucide-react";

interface GameClientPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function GameClientPage({ params }: GameClientPageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { roomId } = await params;
  // TODO: Use roomId to fetch game data from Convex

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Game Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Round 3 of 10
                  <Badge variant="secondary">Prompting Phase</Badge>
                </CardTitle>
                <CardDescription>
                  Question: &ldquo;Draw something that would make a cat laugh&rdquo;
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="font-mono text-lg">00:25</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <Card>
              <CardHeader>
                <CardTitle>Your Prompt</CardTitle>
                <CardDescription>Describe the image you want AI to create</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    placeholder="A cat wearing a funny hat while..."
                    className="flex-1"
                  />
                  <Button>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Characters remaining: 180/200
                </p>
              </CardContent>
            </Card>

            {/* Generated Images Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generated Images
                </CardTitle>
                <CardDescription>AI is creating images from submitted prompts...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="aspect-square rounded-lg" />
                    <p className="text-sm text-center">Player 1</p>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="aspect-square rounded-lg" />
                    <p className="text-sm text-center">Player 2</p>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="aspect-square rounded-lg" />
                    <p className="text-sm text-center">You</p>
                  </div>
                  <div className="space-y-2">
                    <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Waiting...</p>
                    </div>
                    <p className="text-sm text-center">Player 4</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Players & Scoreboard */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Card Czar: Player 1
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scoreboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">P1</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Player 1</span>
                    </div>
                    <Badge variant="outline">5 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">You</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">You</span>
                    </div>
                    <Badge variant="outline">3 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">P2</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Player 2</span>
                    </div>
                    <Badge variant="outline">2 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">P4</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Player 4</span>
                    </div>
                    <Badge variant="outline">1 pt</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full">
              Leave Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}