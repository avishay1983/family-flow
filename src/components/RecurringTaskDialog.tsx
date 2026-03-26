import { useState } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { Task } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, Archive, CheckCircle2 } from 'lucide-react';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function RecurringTaskDialog({ task, onClose }: Props) {
  const { addTask, updateTask, toggleComplete } = useTaskStore();
  const [mode, setMode] = useState<'choose' | 'reschedule'>('choose');
  const [customDate, setCustomDate] = useState('');

  if (!task) return null;

  const handleMoveToBacklog = () => {
    updateTask(task.id, {
      isBacklog: true,
      completed: false,
      status: 'todo',
      ...(task.assigneeIds.length === 0 ? { assigneeIds: [] } : {}),
    });
    onClose();
    setMode('choose');
  };

  const handleMarkDone = () => {
    toggleComplete(task.id);
    onClose();
    setMode('choose');
  };

  const scheduleAgain = (newDate: Date) => {
    // Mark original as complete
    toggleComplete(task.id);
    // Create new task with new date
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      dueDate: format(newDate, 'yyyy-MM-dd'),
      completed: false,
      status: 'todo',
      createdAt: new Date().toISOString(),
    };
    addTask(newTask);
    onClose();
    setMode('choose');
  };

  const handleClose = () => {
    onClose();
    setMode('choose');
  };

  const options = [
    { label: 'מחר', date: addDays(new Date(), 1) },
    { label: 'בעוד שבוע', date: addWeeks(new Date(), 1) },
    { label: 'בעוד חודש', date: addMonths(new Date(), 1) },
  ];

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-success" />
            המשימה הושלמה!
          </DialogTitle>
          <DialogDescription className="text-sm">
            מה לעשות עם "{task.title}"?
          </DialogDescription>
        </DialogHeader>

        {mode === 'choose' ? (
          <div className="space-y-2 mt-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={handleMarkDone}
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
              <div className="text-right">
                <div className="text-sm font-medium">סמן כבוצע</div>
                <div className="text-[10px] text-muted-foreground">המשימה תיעלם מהרשימה</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={handleMoveToBacklog}
            >
              <Archive className="h-4 w-4 text-primary" />
              <div className="text-right">
                <div className="text-sm font-medium">העבר למחסן משימות</div>
                <div className="text-[10px] text-muted-foreground">שמור במחסן לשימוש עתידי</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={() => setMode('reschedule')}
            >
              <CalendarDays className="h-4 w-4 text-warning" />
              <div className="text-right">
                <div className="text-sm font-medium">תזמן שוב</div>
                <div className="text-[10px] text-muted-foreground">צור משימה חוזרת בתאריך חדש</div>
              </div>
            </Button>

            <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={handleClose}>
              ביטול
            </Button>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {options.map((opt) => (
              <Button
                key={opt.label}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => scheduleAgain(opt.date)}
              >
                <CalendarDays className="h-4 w-4" />
                {opt.label}
                <span className="text-muted-foreground text-xs mr-auto">
                  {format(opt.date, 'dd/MM/yyyy')}
                </span>
              </Button>
            ))}

            <div className="flex gap-2">
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 h-9"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={!customDate}
                onClick={() => scheduleAgain(new Date(customDate))}
              >
                בחר
              </Button>
            </div>

            <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => setMode('choose')}>
              חזור
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
