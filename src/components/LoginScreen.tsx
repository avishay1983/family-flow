import { useState } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { getDeviceId } from '@/lib/device-id';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LogIn, Smartphone } from 'lucide-react';

export function LoginScreen() {
  const [name, setName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState('');
  const { workspaces, setCurrentUser } = useTaskStore();

  const allMembers = Array.from(
    new Set(workspaces.flatMap((w) => w.members))
  );

  const registerDevice = async (userName: string) => {
    if (!isOwner) return;
    const deviceId = getDeviceId();
    await supabase.from('device_registrations').upsert(
      { device_id: deviceId, user_name: userName, device_label: navigator.userAgent.slice(0, 100) },
      { onConflict: 'device_id' }
    );
  };

  const handleLogin = async (userName?: string) => {
    const target = userName || name.trim();
    if (!target) {
      setError('נא להזין שם משתמש');
      return;
    }
    const found = allMembers.find(
      (m) => m === target || m.toLowerCase() === target.toLowerCase()
    );
    if (found) {
      await registerDevice(found);
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

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={isOwner}
              onCheckedChange={(v) => setIsOwner(!!v)}
            />
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">זה המכשיר שלי (קבל התראות)</span>
          </label>

          <Button onClick={() => handleLogin()} className="w-full gap-2">
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
                    onClick={() => handleLogin(member)}
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
