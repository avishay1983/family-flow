import { useState } from 'react';
import { useTaskStore } from '@/lib/task-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, UserPlus } from 'lucide-react';

interface Props {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}

export function WorkspaceMembersDialog({ workspaceId, open, onClose }: Props) {
  const { workspaces, addMemberToWorkspace, removeMemberFromWorkspace } = useTaskStore();
  const [newMember, setNewMember] = useState('');

  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return null;

  const handleAdd = () => {
    const name = newMember.trim();
    if (name && !workspace.members.includes(name)) {
      addMemberToWorkspace(workspaceId, name);
      setNewMember('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>{workspace.icon} חברי {workspace.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            <Input
              placeholder="שם חבר חדש"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="h-9 flex-1"
              autoFocus
            />
            <Button size="sm" onClick={handleAdd} disabled={!newMember.trim()} className="h-9 gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              הוסף
            </Button>
          </div>

          {workspace.members.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {workspace.members.map((member) => (
                <Badge key={member} variant="secondary" className="gap-1.5 text-sm py-1 px-2.5">
                  {member}
                  <button
                    onClick={() => removeMemberFromWorkspace(workspaceId, member)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              אין חברים עדיין. הוסף חברים כדי לשייך אותם למשימות.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
