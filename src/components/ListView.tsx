import { useState, useCallback } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { Task, Priority } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format, isPast, isToday, isYesterday, isTomorrow, parseISO, startOfWeek, endOfWeek, isWithinInterval, isBefore } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar, Clock, User, AlertCircle, Trash2, Pencil, ArrowRightLeft, GripVertical, Info, ChevronDown, ChevronUp, CheckCircle2, Archive, CalendarDays, ListChecks, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { RecurringTaskDialog } from './RecurringTaskDialog';
import { EditTaskModal } from './EditTaskModal';
import { MoveTaskDialog } from './MoveTaskDialog';
import { SwipeableTask } from './SwipeableTask';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const priorityStyles: Record<Priority, string> = {
  high: 'bg-destructive/8 text-destructive border-destructive/15',
  medium: 'bg-warning/8 text-warning border-warning/15',
  low: 'bg-success/8 text-success border-success/15',
};
const priorityLabels: Record<Priority, string> = { high: 'גבוה', medium: 'בינוני', low: 'נמוך' };

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return '📌 היום';
  if (isTomorrow(date)) return '⏳ מחר';
  if (isYesterday(date)) return '⚠️ אתמול';
  if (isPast(date)) return `⚠️ ${format(date, 'EEEE, dd/MM', { locale: he })}`;
  return format(date, 'EEEE, dd/MM', { locale: he });
}

type WeekSection = {
  sectionLabel: string;
  sectionType: 'overdue' | 'this-week' | 'future';
  dateGroups: { label: string; dateKey: string; tasks: Task[] }[];
};

function groupTasksByWeek(tasks: Task[]): WeekSection[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  const overdue: Record<string, Task[]> = {};
  const thisWeek: Record<string, Task[]> = {};
  const future: Record<string, Task[]> = {};

  const noDate: Task[] = [];

  for (const task of tasks) {
    if (!task.dueDate) {
      noDate.push(task);
      continue;
    }
    const key = task.dueDate.split('T')[0];
    const date = parseISO(key);

    if (isNaN(date.getTime())) {
      noDate.push(task);
      continue;
    }

    if (isPast(date) && !isToday(date) && !task.completed) {
      if (!overdue[key]) overdue[key] = [];
      overdue[key].push(task);
    } else if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
      if (!thisWeek[key]) thisWeek[key] = [];
      thisWeek[key].push(task);
    } else {
      if (!future[key]) future[key] = [];
      future[key].push(task);
    }
  }

  const toGroups = (groups: Record<string, Task[]>) =>
    Object.entries(groups)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([dateKey, tasks]) => ({ label: getDateLabel(dateKey), dateKey, tasks }));

  const sections: WeekSection[] = [];

  const overdueGroups = toGroups(overdue);
  if (overdueGroups.length > 0) {
    sections.push({ sectionLabel: '⚠️ באיחור', sectionType: 'overdue', dateGroups: overdueGroups });
  }

  const thisWeekGroups = toGroups(thisWeek);
  if (thisWeekGroups.length > 0) {
    sections.push({ sectionLabel: '📅 השבוע', sectionType: 'this-week', dateGroups: thisWeekGroups });
  }

  const futureGroups = toGroups(future);
  if (futureGroups.length > 0) {
    sections.push({ sectionLabel: '🔮 שבועות הבאים', sectionType: 'future', dateGroups: futureGroups });
  }

  if (noDate.length > 0) {
    sections.push({ sectionLabel: '📋 ללא תאריך', sectionType: 'future', dateGroups: [{ label: 'ללא תאריך', dateKey: 'no-date', tasks: noDate }] });
  }

  return sections;
}

function SortableTaskItem({ task, workspaces, isOverdue, onToggle, onEdit, onDelete, onMove, selectionMode, isSelected, onSelect }: {
  task: Task;
  workspaces: any[];
  isOverdue: (task: Task) => boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (task: Task) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const ws = workspaces.find((w: any) => w.id === task.workspaceId);
  const assigneeNames = task.assigneeIds;
  const overdue = isOverdue(task);

  return (
    <div ref={setNodeRef} style={style}>
      <SwipeableTask onDelete={() => onDelete(task.id)}>
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 md:py-3 py-4 transition-all duration-200 hover:bg-accent/40 group border ${
            selectionMode && isSelected ? 'bg-primary/8 border-primary/30' :
            overdue ? 'bg-destructive/4 border-destructive/10 hover:bg-destructive/8' : 'border-transparent hover:border-border/50'
          } ${task.completed ? 'opacity-50' : ''}`}
          onClick={selectionMode ? () => onSelect?.(task.id) : undefined}
        >
          {/* Drag handle */}
          {!selectionMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing shrink-0 touch-none"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}

          {selectionMode ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect?.(task.id)}
                className="shrink-0 h-5 w-5 md:h-4 md:w-4"
              />
            </div>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task)}
                className="shrink-0 h-5 w-5 md:h-4 md:w-4"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.title}
              </span>
              {overdue && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
              {task.description && (
                <Popover>
                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="shrink-0 p-0.5 rounded-full hover:bg-accent transition-colors">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="max-w-xs text-right text-sm" dir="rtl">
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 md:hidden">
              <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityStyles[task.priority]}`}>
                {priorityLabels[task.priority]}
              </Badge>
              {task.dueTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.dueTime}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onMove(task); }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md hover:bg-accent transition-colors"
              >
                {ws ? (
                  <><span>{ws.icon}</span><span>{ws.name}</span></>
                ) : (
                  <><ArrowRightLeft className="h-3 w-3" /><span>קשר למרחב</span></>
                )}
              </button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>

          <Badge variant="outline" className={`text-[10px] shrink-0 hidden md:inline-flex ${priorityStyles[task.priority]}`}>
            {priorityLabels[task.priority]}
          </Badge>

          <button
            onClick={(e) => { e.stopPropagation(); onMove(task); }}
            className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 hidden md:inline-flex bg-muted/60 px-2 py-0.5 rounded-md hover:bg-accent transition-colors"
          >
            {ws ? (
              <><span>{ws.icon}</span><span>{ws.name}</span></>
            ) : (
              <><ArrowRightLeft className="h-3 w-3" /><span>קשר למרחב</span></>
            )}
          </button>

          {assigneeNames.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 hidden lg:flex">
              <User className="h-3 w-3" />
              {assigneeNames.join(', ')}
            </div>
          )}

          <div className={`items-center gap-1 text-xs shrink-0 hidden md:flex ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {task.dueTime && (
              <>
                <Clock className="h-3 w-3" />
                {task.dueTime}
              </>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onMove(task)}
              className="p-1.5 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
              title="העבר למרחב אחר"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded hover:bg-accent transition-all text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
              title="ערוך משימה"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground md:opacity-0 md:group-hover:opacity-100"
              title="מחק משימה"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </SwipeableTask>
    </div>
  );
}

export function ListView() {
  const { getFilteredTasks, toggleComplete, deleteTask, updateTask, workspaces, reorderTasks, activeWorkspace } = useTaskStore();
  const [recurringTask, setRecurringTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [moveTask, setMoveTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkReschedule, setShowBulkReschedule] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showBulkDatePicker, setShowBulkDatePicker] = useState(false);
  const [bulkTime, setBulkTime] = useState('');
  const [showBulkMove, setShowBulkMove] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const isBacklog = activeWorkspace === 'backlog';

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);
  const allTasks = getFilteredTasks().sort((a, b) => {
    if ((a.position ?? 0) !== (b.position ?? 0)) return (a.position ?? 0) - (b.position ?? 0);
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  
  // Separate completed from active
  const activeTasks = allTasks.filter(t => !t.completed);
  const completedTasks = allTasks.filter(t => t.completed);
  const tasks = activeTasks; // sections use only active
  const sections = groupTasksByWeek(tasks);

  // Group backlog tasks by workspace
  const backlogByWorkspace = isBacklog ? (() => {
    const groups: { wsId: string; wsLabel: string; wsIcon: string; tasks: Task[] }[] = [];
    const unlinked: Task[] = [];
    const wsMap = new Map(workspaces.map(w => [w.id, w]));
    
    for (const task of tasks) {
      if (task.workspaceId && wsMap.has(task.workspaceId)) {
        let group = groups.find(g => g.wsId === task.workspaceId);
        if (!group) {
          const ws = wsMap.get(task.workspaceId)!;
          group = { wsId: ws.id, wsLabel: ws.name, wsIcon: ws.icon, tasks: [] };
          groups.push(group);
        }
        group.tasks.push(task);
      } else {
        unlinked.push(task);
      }
    }
    return { groups, unlinked };
  })() : null;

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleToggle = (task: Task) => {
    if (!task.completed) {
      // Show completion dialog - don't toggle yet, dialog will handle it
      setRecurringTask(task);
    } else {
      // Uncompleting - just toggle directly
      toggleComplete(task.id);
    }
  };

  const isOverdue = (task: Task) => !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    const targetTask = tasks.find((t) => t.id === over.id);
    if (!draggedTask || !targetTask) return;

    const draggedDateKey = draggedTask.dueDate?.split('T')[0] || '';
    const targetDateKey = targetTask.dueDate?.split('T')[0] || '';

    // If dropped on a different date group, update the due date
    if (draggedDateKey !== targetDateKey && targetDateKey) {
      updateTask(draggedTask.id, { dueDate: targetDateKey });
    }

    const allTaskIds = tasks.map((t) => t.id);
    const oldIndex = allTaskIds.indexOf(active.id as string);
    const newIndex = allTaskIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(allTaskIds, oldIndex, newIndex);
    reorderTasks(reordered);
  };

  const sectionStyles: Record<string, { bg: string; border: string; text: string }> = {
    'overdue': { bg: 'bg-destructive/6', border: 'border-destructive/20', text: 'text-destructive' },
    'this-week': { bg: 'bg-primary/6', border: 'border-primary/20', text: 'text-primary' },
    'future': { bg: 'bg-muted/40', border: 'border-border/50', text: 'text-muted-foreground' },
  };

  const allTaskIds = allTasks.map((t) => t.id);

  const toggleSelectTask = useCallback((id: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedTaskIds(new Set());
    setShowBulkDatePicker(false);
    setBulkTime('');
    setShowBulkMove(false);
    setBulkDeleteConfirm(false);
  }, []);

  const selectAllActive = useCallback(() => {
    setSelectedTaskIds(new Set(activeTasks.map(t => t.id)));
  }, [activeTasks]);

  const renderTaskList = (taskList: Task[]) => (
    <div className="space-y-1">
      {taskList.map((task) => (
        <SortableTaskItem
          key={task.id}
          task={task}
          workspaces={workspaces}
          isOverdue={isOverdue}
          onToggle={handleToggle}
          onEdit={setEditTask}
          onDelete={(id) => setDeleteId(id)}
          onMove={setMoveTask}
          selectionMode={selectionMode && !task.completed}
          isSelected={selectedTaskIds.has(task.id)}
          onSelect={toggleSelectTask}
        />
      ))}
    </div>
  );

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-6" dir="rtl">
            {/* Selection mode toggle */}
            {activeTasks.length > 0 && !isBacklog && (
              <div className="flex items-center gap-2">
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
                >
                  <ListChecks className="h-4 w-4" />
                  {selectionMode ? 'בטל בחירה' : 'בחירה מרובה'}
                </Button>
                {selectionMode && (
                  <>
                    <Button variant="ghost" size="sm" onClick={selectAllActive} className="text-xs">
                      בחר הכל ({activeTasks.length})
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      נבחרו {selectedTaskIds.size}
                    </span>
                  </>
                )}
              </div>
            )}
            {isBacklog && backlogByWorkspace ? (
              <>
                {backlogByWorkspace.groups.map((group) => (
                  <div key={group.wsId}>
                    <button
                      onClick={() => toggleGroup(group.wsId)}
                      className="w-full flex items-center gap-2 py-2.5 px-4 mb-1 rounded-2xl bg-primary/6 border border-primary/20 backdrop-blur-sm hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <ChevronDown className={`h-4 w-4 text-primary transition-transform ${expandedGroups.has(group.wsId) ? '' : '-rotate-90'}`} />
                      <span className="text-sm font-bold text-primary">
                        {group.wsIcon} {group.wsLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({group.tasks.length})
                      </span>
                    </button>
                    {expandedGroups.has(group.wsId) && (
                      <div className="pr-1 mt-2">
                        {renderTaskList(group.tasks)}
                      </div>
                    )}
                  </div>
                ))}
                {backlogByWorkspace.unlinked.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleGroup('__unlinked')}
                      className="w-full flex items-center gap-2 py-2.5 px-4 mb-1 rounded-2xl bg-muted/40 border border-border/50 backdrop-blur-sm hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedGroups.has('__unlinked') ? '' : '-rotate-90'}`} />
                      <span className="text-sm font-bold text-muted-foreground">
                        📋 ללא מרחב
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({backlogByWorkspace.unlinked.length})
                      </span>
                    </button>
                    {expandedGroups.has('__unlinked') && (
                      <div className="pr-1 mt-2">
                        {renderTaskList(backlogByWorkspace.unlinked)}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {sections.map((section) => {
                  const style = sectionStyles[section.sectionType];
                  const totalCount = section.dateGroups.reduce((sum, g) => sum + g.tasks.length, 0);
                  return (
                    <div key={section.sectionType} className="space-y-2">
                      {/* Section header */}
                      <div className={`flex items-center gap-3 py-3 px-4 rounded-2xl ${style.bg} border ${style.border}`}>
                        <span className={`text-base font-bold ${style.text}`}>
                          {section.sectionLabel}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                          {totalCount}
                        </span>
                      </div>

                      {/* Date sub-groups */}
                      <div className="space-y-1 pr-2 border-r-2 border-border/20 mr-2">
                        {section.dateGroups.map(({ label, dateKey, tasks: dateTasks }) => {
                          const hasOverdue = dateTasks.some(isOverdue);
                          return (
                            <div key={dateKey}>
                              <div className={`sticky top-0 z-10 flex items-center gap-2 py-1.5 px-3 mb-1 backdrop-blur-xl bg-background/80 rounded-lg`}>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${hasOverdue ? 'bg-destructive' : 'bg-primary/50'}`} />
                                <span className={`text-xs font-semibold ${hasOverdue ? 'text-destructive' : 'text-foreground/80'}`}>
                                  {label}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  ({dateTasks.length})
                                </span>
                              </div>
                              {renderTaskList(dateTasks)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Completed tasks section */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowCompleted(!showCompleted); setShowBulkActions(false); setShowBulkReschedule(false); }}
                    className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-success/6 border border-success/15 flex-1 text-right hover:bg-success/10 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-base font-bold text-success/80">
                      ✅ הושלמו
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/15">
                      {completedTasks.length}
                    </span>
                    <span className="mr-auto">
                      {showCompleted ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </span>
                  </button>
                  <button
                    onClick={() => { setShowBulkActions(!showBulkActions); setShowBulkReschedule(false); }}
                    className="p-3 rounded-2xl bg-muted/60 border border-border/40 hover:bg-accent transition-colors shrink-0"
                    title="פעולות גורפות"
                  >
                    <span className="text-lg">⚡</span>
                  </button>
                </div>

                {/* Bulk actions panel */}
                {showBulkActions && (
                  <div className="rounded-2xl border border-border/50 bg-card/80 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-medium text-muted-foreground px-1">פעולות על כל {completedTasks.length} המשימות שהושלמו:</p>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 h-11"
                      onClick={() => {
                        const currentUser = useTaskStore.getState().currentUser;
                        completedTasks.forEach(t => updateTask(t.id, { 
                          isBacklog: true,
                          completed: false,
                          status: 'todo',
                          ...(currentUser ? { assigneeIds: [currentUser] } : {})
                        }));
                        setShowBulkActions(false);
                      }}
                    >
                      <Archive className="h-4 w-4 text-primary" />
                      <div className="text-right">
                        <div className="text-sm font-medium">העבר הכל למחסן משימות</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 h-11"
                      onClick={() => setShowBulkReschedule(!showBulkReschedule)}
                    >
                      <CalendarDays className="h-4 w-4 text-warning" />
                      <div className="text-right">
                        <div className="text-sm font-medium">קבע תאריך עתידי לכולן</div>
                      </div>
                    </Button>

                    {showBulkReschedule && (
                      <div className="space-y-1.5 pr-2 border-r-2 border-warning/20 mr-2">
                        {[
                          { label: 'מחר', date: addDays(new Date(), 1) },
                          { label: 'בעוד שבוע', date: addWeeks(new Date(), 1) },
                          { label: 'בעוד חודש', date: addMonths(new Date(), 1) },
                        ].map((opt) => (
                          <Button
                            key={opt.label}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 h-9 text-xs"
                            onClick={() => {
                              const newDate = format(opt.date, 'yyyy-MM-dd');
                              completedTasks.forEach(t => {
                                updateTask(t.id, { dueDate: newDate, completed: false, status: 'todo' });
                              });
                              setShowBulkActions(false);
                              setShowBulkReschedule(false);
                            }}
                          >
                            <CalendarDays className="h-3.5 w-3.5" />
                            {opt.label}
                            <span className="text-muted-foreground mr-auto text-[10px]">
                              {format(opt.date, 'dd/MM/yyyy')}
                            </span>
                          </Button>
                        ))}
                        <div className="flex gap-2 mt-1">
                          <input
                            type="date"
                            className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                            onChange={(e) => {
                              if (e.target.value) {
                                completedTasks.forEach(t => {
                                  updateTask(t.id, { dueDate: e.target.value, completed: false, status: 'todo' });
                                });
                                setShowBulkActions(false);
                                setShowBulkReschedule(false);
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground text-xs"
                      onClick={() => { setShowBulkActions(false); setShowBulkReschedule(false); }}
                    >
                      ביטול
                    </Button>
                  </div>
                )}

                {showCompleted && (
                  <div className="pr-2 border-r-2 border-success/15 mr-2 opacity-60">
                    {renderTaskList(completedTasks)}
                  </div>
                )}
              </div>
            )}

            {allTasks.length === 0 && (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <p className="text-sm">אין משימות להצגה</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

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
              onClick={() => { if (deleteId) { deleteTask(deleteId); setDeleteId(null); } }}
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
      <MoveTaskDialog task={moveTask} onClose={() => setMoveTask(null)} />

      {/* Floating bulk date bar */}
      <AnimatePresence>
        {selectionMode && selectedTaskIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl bg-card border border-border shadow-lg p-3 space-y-2"
            dir="rtl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedTaskIds.size} משימות נבחרו</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exitSelectionMode}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10"
              onClick={() => setShowBulkDatePicker(!showBulkDatePicker)}
            >
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">קבע תאריך ביצוע</span>
            </Button>

            {showBulkDatePicker && (
              <div className="space-y-1.5 pr-2 border-r-2 border-primary/20 mr-2">
                {[
                  { label: 'היום', date: new Date() },
                  { label: 'מחר', date: addDays(new Date(), 1) },
                  { label: 'בעוד שבוע', date: addWeeks(new Date(), 1) },
                  { label: 'בעוד חודש', date: addMonths(new Date(), 1) },
                ].map((opt) => (
                  <Button
                    key={opt.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-9 text-xs"
                    onClick={() => {
                      const newDate = format(opt.date, 'yyyy-MM-dd');
                      selectedTaskIds.forEach(id => {
                        updateTask(id, { dueDate: newDate });
                      });
                      exitSelectionMode();
                    }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {opt.label}
                    <span className="text-muted-foreground mr-auto text-[10px]">
                      {format(opt.date, 'dd/MM/yyyy')}
                    </span>
                  </Button>
                ))}
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                    onChange={(e) => {
                      if (e.target.value) {
                        selectedTaskIds.forEach(id => {
                          updateTask(id, { dueDate: e.target.value });
                        });
                        exitSelectionMode();
                      }
                    }}
                  />
                </div>

                {/* Bulk time picker */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">קבע שעה לכולם</span>
                  <input
                    type="time"
                    value={bulkTime}
                    onChange={(e) => setBulkTime(e.target.value)}
                    className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs px-3"
                    disabled={!bulkTime}
                    onClick={() => {
                      selectedTaskIds.forEach(id => {
                        updateTask(id, { dueTime: bulkTime });
                      });
                      exitSelectionMode();
                    }}
                  >
                    החל
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}