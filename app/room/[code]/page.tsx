import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Settings, Play } from "lucide-react";

interface RoomLobbyPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function RoomLobbyPage({ params }: RoomLobbyPageProps) {
  const { code } = await params;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Room Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Room {code}</CardTitle>
                <CardDescription>Waiting for players to join</CardDescription>
              </div>
              <Badge variant="secondary">Waiting</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>3/8 players</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>30s rounds • 10 rounds total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Players List */}
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>H</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Host Player</p>
                      <Badge variant="outline" className="text-xs">Host</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>P1</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">Player 1</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>P2</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">Player 2</p>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Waiting for more players...
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Max Players:</span>
                  <span>8</span>
                </div>
                <div className="flex justify-between">
                  <span>Round Timer:</span>
                  <span>30 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Rounds:</span>
                  <span>10</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Type:</span>
                  <span>Public</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button size="lg" disabled>
            <Play className="mr-2 h-4 w-4" />
            Waiting for Players
          </Button>
          <Button variant="outline" size="lg">
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}