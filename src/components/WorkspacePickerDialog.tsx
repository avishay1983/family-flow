import { useState, useEffect } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { getOrderedWorkspaces, getAppSettings } from '@/components/SettingsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [onboardingDone, setOnboardingDone] = useState(() => localStorage.getItem(ONBOARDING_KEY) === 'true');

  // Listen for onboarding completion
  useEffect(() => {
    if (onboardingDone) return;
    const check = () => setOnboardingDone(localStorage.getItem(ONBOARDING_KEY) === 'true');
    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, [onboardingDone]);

  const open = !isLoading && workspaces.length > 0 && !activeWorkspace && onboardingDone;

  return (
    <Dialog open={open}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-sm [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg">בחר מרחב עבודה</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 mt-2">
          {(() => {
            const appSettings = getAppSettings();
            const ordered = getOrderedWorkspaces(workspaces);
            const visibleWs = ordered.filter(ws => !(appSettings.hiddenWorkspaceIds || []).includes(ws.id));
            
            // Build combined list with backlog at its saved position
            const savedOrder = appSettings.workspaceOrder || [];
            const backlogIndex = savedOrder.indexOf('__backlog__');
            const showBacklog = !appSettings.hideBacklog;
            
            // Map workspaces to render items
            type RenderItem = { type: 'workspace'; ws: typeof visibleWs[0] } | { type: 'backlog' };
            const items: RenderItem[] = visibleWs.map(ws => ({ type: 'workspace' as const, ws }));
            
            if (showBacklog) {
              if (backlogIndex >= 0) {
                // Count how many visible workspaces come before backlog in saved order
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
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-right"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-2xl">📋</span>
                    </div>
                    <span className="font-medium text-foreground">מחסן משימות</span>
                  </button>
                );
              }
              return (
                <button
                  key={item.ws.id}
                  onClick={() => setActiveWorkspace(item.ws.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-right"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <IconDisplay icon={item.ws.icon} />
                  </div>
                  <span className="font-medium text-foreground">{item.ws.name}</span>
                </button>
              );
            });
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
