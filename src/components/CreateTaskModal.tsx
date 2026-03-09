import { useState, useEffect } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { Task, Priority } from '@/lib/types';
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
import { X } from 'lucide-react';

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

export function CreateTaskModal({ open, onClose }: Props) {
  const { addTask, workspaces } = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderBefore, setReminderBefore] = useState('1h');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const selectedWorkspace = workspaces.find((w) => w.id === workspaceId);
  const members = selectedWorkspace?.members || [];

  // Reset assignee when workspace changes
  useEffect(() => {
    setAssigneeId(members[0] || '');
  }, [workspaceId]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title,
      description,
      workspaceId,
      assigneeId,
      priority,
      status: 'todo',
      tags,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      dueTime,
      reminderBefore,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    addTask(task);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setDueTime('');
    setTags([]);
    setTagInput('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg">משימה חדשה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            placeholder="שם המשימה"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-medium"
            autoFocus
          />
          <Textarea
            placeholder="תיאור (אופציונלי)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">מרחב עבודה</label>
              <Select value={workspaceId} onValueChange={setWorkspaceId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">אחראי</label>
              {members.length > 0 ? (
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="בחר אחראי" /></SelectTrigger>
                  <SelectContent>
                    {members.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">אין חברים במרחב זה. הוסף חברים דרך הסיידבר.</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">תאריך יעד</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">שעת יעד</label>
              <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="h-9" />
            </div>
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

          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
            צור משימה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
