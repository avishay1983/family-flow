import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTaskStore } from '@/lib/task-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Settings, RotateCcw, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
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

const SETTINGS_KEY = 'taskmaster_settings';
const ONBOARDING_KEY = 'taskmaster_onboarding_done';

export interface AppSettings {
  autoSelectWorkspace: boolean;
  defaultWorkspaceId: string;
  defaultViewMode: 'list' | 'kanban' | '';
  workspaceOrder: string[];
  hiddenWorkspaceIds: string[];
  hideBacklog: boolean;
}

const defaultSettings: AppSettings = {
  autoSelectWorkspace: false,
  defaultWorkspaceId: '',
  defaultViewMode: '',
  workspaceOrder: [],
  hiddenWorkspaceIds: [],
  hideBacklog: false,
};

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

export function getOrderedWorkspaces<T extends { id: string }>(workspaces: T[]): T[] {
  const order = getAppSettings().workspaceOrder;
  if (!order.length) return workspaces;
  const map = new Map(workspaces.map((w) => [w.id, w]));
  const ordered: T[] = [];
  for (const id of order) {
    const ws = map.get(id);
    if (ws) {
      ordered.push(ws);
      map.delete(id);
    }
  }
  for (const ws of map.values()) {
    ordered.push(ws);
  }
  return ordered;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const SortableWorkspaceItem = React.forwardRef<HTMLDivElement, {
  id: string;
  icon: string;
  name: string;
  visible: boolean;
  onToggleVisibility: (id: string) => void;
}>(({ id, icon, name, visible, onToggleVisibility }, ref) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      style={style}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none shrink-0">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <Checkbox
        checked={visible}
        onCheckedChange={() => onToggleVisibility(id)}
        className="shrink-0 h-4 w-4"
      />
      <span className={`text-base ${!visible ? 'opacity-40' : ''}`}>{icon}</span>
      <span className={`text-sm font-medium ${!visible ? 'opacity-40 text-muted-foreground' : 'text-foreground'}`}>{name}</span>
    </div>
  );
});

SortableWorkspaceItem.displayName = 'SortableWorkspaceItem';

export function SettingsDialog({ open, onClose }: Props) {
  const [settings, setSettings] = useState<AppSettings>(getAppSettings);
  const { workspaces } = useTaskStore();
  const { theme, setTheme } = useTheme();
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  useEffect(() => {
    if (open) {
      const s = getAppSettings();
      setSettings(s);
      const ordered = getOrderedWorkspaces(workspaces);
      const ids = ordered.map((w) => w.id);
      const backlogId = '__backlog__';
      const savedOrder = s.workspaceOrder || [];
      const backlogIndex = savedOrder.indexOf(backlogId);
      if (backlogIndex >= 0 && backlogIndex <= ids.length) {
        ids.splice(backlogIndex, 0, backlogId);
      } else {
        ids.push(backlogId);
      }
      setOrderedIds(ids);
    }
  }, [open, workspaces]);

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    if ('defaultWorkspaceId' in patch) {
      next.autoSelectWorkspace = patch.defaultWorkspaceId !== '';
    }
    setSettings(next);
    saveSettings(next);
  };

  const toggleWorkspaceVisibility = (id: string) => {
    if (id === '__backlog__') {
      update({ hideBacklog: !settings.hideBacklog });
      return;
    }
    const hidden = settings.hiddenWorkspaceIds || [];
    const newHidden = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
    update({ hiddenWorkspaceIds: newHidden });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(active.id as string);
    const newIndex = orderedIds.indexOf(over.id as string);
    const newOrder = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newOrder);
    update({ workspaceOrder: newOrder });
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    onClose();
    window.location.reload();
  };

  const wsMap = new Map(workspaces.map((w) => [w.id, w]));
  const selectedWorkspaceValue = settings.defaultWorkspaceId || 'dialog';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm max-h-[85dvh] overflow-hidden p-0" dir="rtl">
        <div className="flex h-full max-h-[85dvh] flex-col">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              הגדרות
            </DialogTitle>
            <DialogDescription className="text-right">
              נהל תצוגת פתיחה, פריסת רשימה או קנבן, סדר מרחבי העבודה וערכת הנושא.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="mt-2 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">מרחב עבודה בפתיחת האפליקציה</Label>
                <p className="text-xs text-muted-foreground">
                  בחר אם להציג דיאלוג בחירה או לפתוח מרחב עבודה ספציפי אוטומטית
                </p>
                {isMobile ? (
                  <div className="space-y-2 rounded-md border border-border bg-card p-2">
                    {[
                      { value: 'dialog', label: 'הצג דיאלוג בחירה', icon: '🗂️' },
                      ...workspaces.map((ws) => ({
                        value: ws.id,
                        label: ws.name,
                        icon: ws.icon,
                      })),
                      { value: 'backlog', label: 'מחסן משימות', icon: '📋' },
                    ].map((option) => {
                      const isSelected = selectedWorkspaceValue === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => update({ defaultWorkspaceId: option.value === 'dialog' ? '' : option.value })}
                          className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-right transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          aria-pressed={isSelected}
                        >
                          <span className="flex items-center gap-2 text-sm text-foreground">
                            <span className="text-base">{option.icon}</span>
                            <span>{option.label}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isSelected ? 'נבחר' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Select
                    value={selectedWorkspaceValue}
                    onValueChange={(v) => update({ defaultWorkspaceId: v === 'dialog' ? '' : v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="dialog">הצג דיאלוג בחירה</SelectItem>
                      {workspaces.map((ws) => (
                        <SelectItem key={ws.id} value={ws.id}>
                          {ws.icon} {ws.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="backlog">📋 מחסן משימות</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">תצוגה ברירת מחדל</Label>
                <p className="text-xs text-muted-foreground">
                  בחר את סוג התצוגה שתוצג בכניסה לאפליקציה
                </p>
                {isMobile ? (
                  <div className="space-y-2 rounded-md border border-border bg-card p-2">
                    {[
                      { value: 'list', label: '📋 רשימה' },
                      { value: 'kanban', label: '📊 קנבן' },
                    ].map((option) => {
                      const isSelected = (settings.defaultViewMode || 'list') === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => update({ defaultViewMode: option.value as 'list' | 'kanban' })}
                          className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-right transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          aria-pressed={isSelected}
                        >
                          <span className="text-sm text-foreground">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{isSelected ? 'נבחר' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Select
                    value={settings.defaultViewMode || 'list'}
                    onValueChange={(v) => update({ defaultViewMode: v as 'list' | 'kanban' })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="list">📋 רשימה</SelectItem>
                      <SelectItem value="kanban">📊 קנבן</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">סדר והצגת מרחבי עבודה</Label>
                <p className="text-xs text-muted-foreground">
                  גרור כדי לשנות סדר, וסמן אילו מרחבים יוצגו בדיאלוג הבחירה
                </p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {orderedIds.map((id) => {
                        if (id === '__backlog__') {
                          return (
                            <SortableWorkspaceItem
                              key={id}
                              id={id}
                              icon="📋"
                              name="מחסן משימות"
                              visible={!settings.hideBacklog}
                              onToggleVisibility={toggleWorkspaceVisibility}
                            />
                          );
                        }
                        const ws = wsMap.get(id);
                        if (!ws) return null;
                        return (
                          <SortableWorkspaceItem
                            key={id}
                            id={id}
                            icon={ws.icon}
                            name={ws.name}
                            visible={!settings.hiddenWorkspaceIds?.includes(id)}
                            onToggleVisibility={toggleWorkspaceVisibility}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">ערכת נושא</Label>
                <Select value={theme || 'light'} onValueChange={setTheme}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="light">☀️ בהיר</SelectItem>
                    <SelectItem value="dark">🌙 כהה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetOnboarding}
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  הצג שוב את סיור ההדרכה
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-background px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button
              variant="default"
              className="h-11 w-full rounded-2xl font-bold"
              onClick={onClose}
            >
              סגור
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
