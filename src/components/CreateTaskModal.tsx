import { useState, useEffect, useCallback } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { Task, Priority } from '@/lib/types';
import { addDays, addWeeks, format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  high: { label: 'גבוה', color: 'bg-destructive text-destructive-foreground' },
  medium: { label: 'בינוני', color: 'bg-warning text-warning-foreground' },
  low: { label: 'נמוך', color: 'bg-success text-success-foreground' },
};

const reminderOptions = [
  { value: '15m', label: '15 דקות לפני' },
  { value: '30m', label: '30 דקות לפני' },
  { value: '1h', label: 'שעה לפני' },
  { value: '2h', label: 'שעתיים לפני' },
  { value: '1d', label: 'יום לפני' },
];

type DatePickOption = 'today' | 'tomorrow' | 'next_week' | 'calendar';

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function CreateTaskModal({ open, onClose }: Props) {
  const { addTask, workspaces, activeWorkspace, currentUser } = useTaskStore();
  const isBacklogMode = activeWorkspace === 'backlog';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState(isBacklogMode ? '' : (activeWorkspace || workspaces[0]?.id || ''));
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [dateOption, setDateOption] = useState<DatePickOption>('today');
  const [dueDate, setDueDate] = useState(toLocalDateString(new Date()));
  const [dueTime, setDueTime] = useState('');
  const [reminderBefore, setReminderBefore] = useState('1h');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedWorkspace = workspaces.find((w) => w.id === workspaceId);
  const members = selectedWorkspace?.members || [];

  useEffect(() => {
    if (open) {
      setWorkspaceId(isBacklogMode ? '' : (activeWorkspace || workspaces[0]?.id || ''));
    }
  }, [open, activeWorkspace, isBacklogMode, workspaces]);

  useEffect(() => {
    setAssigneeIds([]);
  }, [workspaceId]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDateOption = (option: DatePickOption) => {
    setDateOption(option);
    if (option === 'today') setDueDate(toLocalDateString(new Date()));
    else if (option === 'tomorrow') setDueDate(toLocalDateString(addDays(new Date(), 1)));
    else if (option === 'next_week') setDueDate(toLocalDateString(addWeeks(new Date(), 1)));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      workspaceId: isBacklogMode ? (workspaceId || '') : (workspaceId || ''),
      assigneeIds: isBacklogMode && currentUser ? [currentUser] : assigneeIds,
      priority,
      status: 'todo',
      tags,
      dueDate,
      dueTime,
      reminderBefore,
      createdAt: new Date().toISOString(),
      completed: false,
      isBacklog: isBacklogMode,
    };
    addTask(task);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDateOption('today');
    setDueDate(toLocalDateString(new Date()));
    setDueTime('');
    setTags([]);
    setTagInput('');
    setCalendarOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg data-[state=open]:animate-scale-in data-[state=closed]:animate-fade-out" dir="rtl">
        <DialogHeader className="animate-fade-in">
         <DialogTitle className="text-lg">{isBacklogMode ? 'משימה חדשה למחסן' : 'משימה חדשה'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto px-1 animate-fade-in">
          <Input
            placeholder="שם המשימה"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-medium"
            autoFocus
            onKeyDown={(e) => {
              if (isBacklogMode && e.key === 'Enter' && title.trim()) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {isBacklogMode && workspaces.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">קשר למרחב עבודה (אופציונלי)</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setWorkspaceId('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    !workspaceId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  ללא
                </button>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => setWorkspaceId(ws.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      workspaceId === ws.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {ws.icon} {ws.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isBacklogMode && (
            <>
              <Textarea
                placeholder="תיאור (אופציונלי)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">מרחב עבודה</label>
                  <Select value={workspaceId || 'none'} onValueChange={(v) => setWorkspaceId(v === 'none' ? '' : v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="ללא מרחב" /></SelectTrigger>
                    <SelectContent>
                      {workspaces.map((ws) => (
                        <SelectItem key={ws.id} value={ws.id}>
                          {ws.icon} {ws.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">אחראים</label>
                  {members.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {members.map((name) => (
                        <label key={name} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={assigneeIds.includes(name)}
                            onCheckedChange={(checked) => {
                              setAssigneeIds(prev =>
                                checked ? [...prev, name] : prev.filter(n => n !== name)
                              );
                            }}
                          />
                          {name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">אין חברים במרחב זה.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">עדיפות</label>
                <div className="flex gap-2">
                  {(Object.keys(priorityConfig) as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        priority === p
                          ? priorityConfig[p].color
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date quick-pick */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">מועד יעד</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { key: 'today' as DatePickOption, label: '📅 היום' },
                    { key: 'tomorrow' as DatePickOption, label: '📅 מחר' },
                    { key: 'next_week' as DatePickOption, label: '📅 בעוד שבוע' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleDateOption(opt.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        dateOption === opt.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        onClick={() => setDateOption('calendar')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          dateOption === 'calendar'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        <CalendarIcon className="h-3 w-3 inline ml-1" />
                        {dateOption === 'calendar' ? format(new Date(dueDate), 'dd/MM/yyyy') : 'בחר תאריך'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(dueDate)}
                        onSelect={(date) => {
                          if (date) {
                            setDueDate(toLocalDateString(date));
                            setDateOption('calendar');
                            setCalendarOpen(false);
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  📌 תאריך יעד: {format(new Date(dueDate), 'dd/MM/yyyy', { locale: he })}
                </p>

                <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="h-9" placeholder="שעת יעד (אופציונלי)" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">תזכורת</label>
                <Select value={reminderBefore} onValueChange={setReminderBefore}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">תגיות</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="הוסף תגית"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="h-9 flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTag} className="h-9">הוסף</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                        {tag}
                        <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
            {isBacklogMode ? 'הוסף למחסן' : 'צור משימה'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
