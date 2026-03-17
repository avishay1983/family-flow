import { useTaskStore } from '@/lib/task-store';
import { Task } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function MoveTaskDialog({ task, onClose }: Props) {
  const { workspaces, updateTask } = useTaskStore();

  if (!task) return null;

  const handleMove = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    updateTask(task.id, {
      workspaceId,
      isBacklog: false,
    });
    toast.success(`המשימה הועברה ל-${ws?.icon} ${ws?.name}`);
    onClose();
  };

  const handleMoveToBacklog = () => {
    updateTask(task.id, {
      workspaceId: '',
      isBacklog: true,
    });
    toast.success('המשימה הועברה למחסן משימות');
    onClose();
  };

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base">העבר משימה למרחב אחר</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 mt-2">
          {workspaces
            .filter((ws) => ws.id !== task.workspaceId)
            .map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleMove(ws.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors text-right"
              >
                <span className="text-lg">{ws.icon}</span>
                <span className="font-medium">{ws.name}</span>
              </button>
            ))}
          {!task.isBacklog && (
            <button
              onClick={handleMoveToBacklog}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors text-right border-t border-border mt-2 pt-3"
            >
              <span className="text-lg">📋</span>
              <span className="font-medium">Backlog</span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
