import { useState } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { Task, TaskStatus, Priority } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { format, isPast, isToday, isValid } from 'date-fns';
import { he } from 'date-fns/locale';

function safeFormatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (!isValid(d)) return '—';
    return format(d, 'dd/MM', { locale: he });
  } catch {
    return '—';
  }
}

function safeIsOverdue(task: { completed: boolean; dueDate: string }): boolean {
  if (task.completed || !task.dueDate) return false;
  try {
    const d = new Date(task.dueDate);
    return isValid(d) && isPast(d) && !isToday(d);
  } catch {
    return false;
  }
}
import { Calendar, AlertCircle, GripVertical, ChevronLeft, ChevronRight, Trash2, Pencil, ArrowRightLeft } from 'lucide-react';
import { RecurringTaskDialog } from './RecurringTaskDialog';
import { MoveTaskDialog } from './MoveTaskDialog';
import { EditTaskModal } from './EditTaskModal';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'לביצוע', color: 'bg-secondary' },
  { id: 'in_progress', label: 'בתהליך', color: 'bg-primary/10' },
  { id: 'done', label: 'בוצע', color: 'bg-success/10' },
];

const priorityDot: Record<Priority, string> = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-success',
};

export function KanbanView() {
  const { getFilteredTasks, updateTaskStatus, deleteTask, workspaces } = useTaskStore();
  const [recurringTask, setRecurringTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [moveToWsTask, setMoveToWsTask] = useState<Task | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const tasks = getFilteredTasks();

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedId) {
      const task = tasks.find((t) => t.id === draggedId);
      if (task && task.status !== status) {
        if (status === 'done' && !task.completed) {
          setRecurringTask(task);
        }
        updateTaskStatus(draggedId, status);
      }
      setDraggedId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const isOverdue = (task: Task) => safeIsOverdue(task);

  const moveTask = (taskId: string, direction: 'next' | 'prev') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentIdx = columns.findIndex((c) => c.id === task.status);
    const targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;
    const targetStatus = columns[targetIdx].id;
    if (targetStatus === 'done' && !task.completed) {
      setRecurringTask(task);
    }
    updateTaskStatus(taskId, targetStatus);
  };

  const renderTaskCard = (task: Task, colIdx: number) => {
    const ws = workspaces.find((w) => w.id === task.workspaceId);
    const assigneeNames = task.assigneeIds;
    const overdue = isOverdue(task);
    const canMoveNext = colIdx < columns.length - 1;
    const canMovePrev = colIdx > 0;

    return (
      <motion.div
        key={task.id}
        layout
        draggable={!isMobile}
        onDragStart={(e) => !isMobile && handleDragStart(e as any, task.id)}
        className={`rounded-xl border bg-card p-3 shadow-sm transition-shadow ${
          isMobile ? 'active:shadow-md' : 'cursor-grab active:cursor-grabbing hover:shadow-md'
        } ${overdue ? 'border-destructive/30' : 'border-border'} ${
          draggedId === task.id ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-start gap-2 group">
          {!isMobile && (
            <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
          )}
          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMoveToWsTask(task);
              }}
              className="p-1 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
              title="העבר למרחב אחר"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditTask(task);
              }}
              className="p-1 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
              title="ערוך משימה"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(task.id);
              }}
              className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground md:opacity-0 md:group-hover:opacity-100"
              title="מחק משימה"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
              <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </span>
            </div>

            {task.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                {overdue && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {safeFormatDate(task.dueDate)}
              </div>

              {ws && <span className="text-xs text-muted-foreground">{ws.icon}</span>}

              {assigneeNames.length > 0 && (
                <span className="mr-auto text-xs text-muted-foreground">
                  {assigneeNames.map((n) => n.split(' ')[0]).join(', ')}
                </span>
              )}
            </div>

            {task.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {isMobile && (
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                {canMovePrev && (
                  <button
                    onClick={() => moveTask(task.id, 'prev')}
                    className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {columns[colIdx - 1].label}
                  </button>
                )}
                {canMoveNext && (
                  <button
                    onClick={() => moveTask(task.id, 'next')}
                    className="mr-auto flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {columns[colIdx + 1].label}
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {isMobile ? (
        <div className="space-y-4" dir="rtl">
          {columns.map((col, colIdx) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <section
                key={col.id}
                className="rounded-2xl border border-border/60 bg-card/50 p-3 shadow-sm"
              >
                <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 ${col.color}`}>
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center text-xs">
                    {colTasks.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {colTasks.length > 0 ? (
                    colTasks.map((task) => renderTaskCard(task, colIdx))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-background/40 px-3 py-5 text-center text-sm text-muted-foreground">
                      אין משימות בעמודה הזו
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
          {columns.map((col, colIdx) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="flex min-w-[280px] flex-1 flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 ${col.color}`}>
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center text-xs">
                    {colTasks.length}
                  </Badge>
                </div>

                <div className="flex-1 space-y-2">
                  {colTasks.map((task) => renderTaskCard(task, colIdx))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת משימה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את המשימה? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteTask(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecurringTaskDialog task={recurringTask} onClose={() => setRecurringTask(null)} />
      <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />
      <MoveTaskDialog task={moveToWsTask} onClose={() => setMoveToWsTask(null)} />
    </>
  );
}
