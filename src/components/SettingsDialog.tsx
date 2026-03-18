import { useState, useEffect } from 'react';
import { useTaskStore } from '@/lib/task-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, RotateCcw } from 'lucide-react';

const SETTINGS_KEY = 'taskmaster_settings';
const ONBOARDING_KEY = 'taskmaster_onboarding_done';

export interface AppSettings {
  autoSelectWorkspace: boolean;
  defaultWorkspaceId: string; // '' = show dialog, workspace id or 'backlog'
  defaultViewMode: 'list' | 'kanban' | '';
}

const defaultSettings: AppSettings = {
  autoSelectWorkspace: false,
  defaultWorkspaceId: '',
  defaultViewMode: '',
};

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: Props) {
  const [settings, setSettings] = useState<AppSettings>(getAppSettings);
  const { workspaces } = useTaskStore();

  useEffect(() => {
    if (open) setSettings(getAppSettings());
  }, [open]);

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    if ('defaultWorkspaceId' in patch) {
      next.autoSelectWorkspace = patch.defaultWorkspaceId !== '';
    }
    setSettings(next);
    saveSettings(next);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    onClose();
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            הגדרות
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">מרחב עבודה בפתיחת האפליקציה</Label>
            <p className="text-xs text-muted-foreground">
              בחר אם להציג דיאלוג בחירה או לפתוח מרחב עבודה ספציפי אוטומטית
            </p>
            <Select
              value={settings.defaultWorkspaceId || 'dialog'}
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
          </div>

          {/* Default view mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">תצוגה ברירת מחדל</Label>
            <p className="text-xs text-muted-foreground">
              בחר את סוג התצוגה שתוצג בכניסה לאפליקציה
            </p>
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
      </DialogContent>
    </Dialog>
  );
}
