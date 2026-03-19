import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTaskStore } from '@/lib/task-store';
import { getOrderedWorkspaces, getAppSettings, SettingsDialog } from '@/components/SettingsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sun, Moon, Settings } from 'lucide-react';
import shabbatIcon from '@/assets/shabbat-icon.png';

const SPECIAL_ICONS: Record<string, string> = {
  shabbat: shabbatIcon,
};
const ONBOARDING_KEY = 'taskmaster_onboarding_done';

function IconDisplay({ icon }: { icon: string }) {
  if (SPECIAL_ICONS[icon]) {
    return <img src={SPECIAL_ICONS[icon]} alt={icon} className="inline-block w-8 h-8" />;
  }
  return <span className="text-2xl">{icon}</span>;
}

export function WorkspacePickerDialog() {
  const { workspaces, activeWorkspace, setActiveWorkspace, isLoading } = useTaskStore();
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => localStorage.getItem(ONBOARDING_KEY) === 'true');

  useEffect(() => {
    if (onboardingDone) return;
    const check = () => setOnboardingDone(localStorage.getItem(ONBOARDING_KEY) === 'true');
    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, [onboardingDone]);

  const shouldShow = !isLoading && workspaces.length > 0 && !activeWorkspace && onboardingDone;

  if (!shouldShow) return null;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-sm [&>button]:hidden rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-center text-lg font-bold flex-1">בחר מרחב עבודה</DialogTitle>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
              aria-label="הגדרות"
            >
              <Settings className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
              aria-label="שנה ערכת נושא"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
            </button>
          </div>
        </DialogHeader>
        <div className="grid gap-2 mt-2">
          {(() => {
            const appSettings = getAppSettings();
            const ordered = getOrderedWorkspaces(workspaces);
            const visibleWs = ordered.filter(ws => !(appSettings.hiddenWorkspaceIds || []).includes(ws.id));
            
            const savedOrder = appSettings.workspaceOrder || [];
            const backlogIndex = savedOrder.indexOf('__backlog__');
            const showBacklog = !appSettings.hideBacklog;
            
            type RenderItem = { type: 'workspace'; ws: typeof visibleWs[0] } | { type: 'backlog' };
            const items: RenderItem[] = visibleWs.map(ws => ({ type: 'workspace' as const, ws }));
            
            if (showBacklog) {
              if (backlogIndex >= 0) {
                let insertAt = 0;
                for (let i = 0; i < backlogIndex; i++) {
                  if (savedOrder[i] !== '__backlog__' && visibleWs.some(w => w.id === savedOrder[i])) {
                    insertAt++;
                  }
                }
                items.splice(insertAt, 0, { type: 'backlog' });
              } else {
                items.push({ type: 'backlog' });
              }
            }
            
            return items.map((item, i) => {
              if (item.type === 'backlog') {
                return (
                  <button
                    key="backlog"
                    onClick={() => setActiveWorkspace('backlog')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm hover:bg-accent/50 hover:border-primary/20 hover:shadow-md transition-all duration-200 text-right group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <span className="text-2xl">📋</span>
                    </div>
                    <span className="font-semibold text-foreground">מחסן משימות</span>
                  </button>
                );
              }
              return (
                <button
                  key={item.ws.id}
                  onClick={() => setActiveWorkspace(item.ws.id)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm hover:bg-accent/50 hover:border-primary/20 hover:shadow-md transition-all duration-200 text-right group"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <IconDisplay icon={item.ws.icon} />
                  </div>
                  <span className="font-semibold text-foreground">{item.ws.name}</span>
                </button>
              );
            });
          })()}
        </div>
      </DialogContent>
    </Dialog>
    <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
