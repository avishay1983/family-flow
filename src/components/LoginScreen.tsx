import { useState } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function LoginScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { workspaces, setCurrentUser } = useTaskStore();

  // Collect all unique member names across workspaces
  const allMembers = Array.from(
    new Set(workspaces.flatMap((w) => w.members))
  );

  const handleLogin = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('נא להזין שם משתמש');
      return;
    }
    const found = allMembers.find(
      (m) => m === trimmed || m.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      setCurrentUser(found);
    } else {
      setError('שם המשתמש לא נמצא. נסה שוב.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl">👋 ברוכים הבאים</CardTitle>
          <CardDescription>הזן את שמך כדי להיכנס</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="שם משתמש..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="text-right"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <Button onClick={handleLogin} className="w-full gap-2">
            <LogIn className="h-4 w-4" />
            כניסה
          </Button>

          {allMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">או בחר מהרשימה:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allMembers.map((member) => (
                  <Button
                    key={member}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentUser(member)}
                    className="text-sm"
                  >
                    {member}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
