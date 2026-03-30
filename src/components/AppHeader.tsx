import { useState } from 'react';
import { useTaskStore } from '@/lib/task-store';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, List, Columns3, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import shabbatIcon from '@/assets/shabbat-icon.png';
import taskmasterLogo from '@/assets/taskmaster-logo.png';

import { CreateTaskModal } from './CreateTaskModal';

const SPECIAL_ICONS: Record<string, string> = { shabbat: shabbatIcon };

function WorkspaceIcon({ icon }: { icon: string }) {
  if (SPECIAL_ICONS[icon]) {
    return <img src={SPECIAL_ICONS[icon]} alt={icon} className="inline-block w-4 h-4" />;
  }
  return <span className="text-sm">{icon}</span>;
}

export function AppHeader() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, getUnreadNotificationCount, activeWorkspace, workspaces, setActiveWorkspace } =
    useTaskStore();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const ws = activeWorkspace && activeWorkspace !== 'backlog' ? workspaces.find((w) => w.id === activeWorkspace) : null;
  const isBacklog = activeWorkspace === 'backlog';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/40 bg-background/60 backdrop-blur-2xl px-3 md:px-4">
        <SidebarTrigger className="shrink-0 hover:bg-accent/60 rounded-xl transition-colors" data-tour="sidebar-trigger" />
        <img src={taskmasterLogo} alt="TaskMaster" className="w-7 h-7 shrink-0" />

        {/* Workspace switcher */}
        {(ws || isBacklog) && (
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl font-semibold px-2.5 hover:bg-accent/60 transition-all">
                {isBacklog ? (
                  <>
                    <span className="text-sm">📋</span>
                    <span className="max-w-[100px] truncate">מחסן משימות</span>
                  </>
                ) : ws ? (
                  <>
                    <WorkspaceIcon icon={ws.icon} />
                    <span className="max-w-[100px] truncate">{ws.name}</span>
                  </>
                ) : null}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px] rounded-xl border-border/50 shadow-lg backdrop-blur-xl bg-popover/95">
              <DropdownMenuItem
                onClick={() => setActiveWorkspace('backlog')}
                className={`gap-2 rounded-lg ${isBacklog ? 'bg-accent font-medium' : ''}`}
              >
                <span className="text-sm">📋</span>
                <span>מחסן משימות</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              {workspaces.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => setActiveWorkspace(w.id)}
                  className={`gap-2 rounded-lg ${w.id === activeWorkspace ? 'bg-accent font-medium' : ''}`}
                >
                  <WorkspaceIcon icon={w.icon} />
                  <span>{w.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Desktop: inline button */}
        <Button
          size="sm"
          onClick={() => setShowCreateTask(true)}
          className="gap-1.5 rounded-xl font-semibold hidden md:flex bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-all shadow-md glow-primary"
          data-tour="add-task"
        >
          <Plus className="h-4 w-4" />
          <span>משימה חדשה</span>
        </Button>


        <div className="relative flex-1 max-w-md mx-auto" data-tour="search">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="חיפוש משימות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 h-9 rounded-xl bg-muted/50 border-border/40 text-sm focus:bg-background focus:border-primary/40 transition-all placeholder:text-muted-foreground/40"
            dir="rtl"
          />
        </div>

        <div className="flex items-center gap-1">

          <div className="flex items-center rounded-xl bg-muted/50 p-0.5" data-tour="view-toggle">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-transparent'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-background shadow-sm' : 'hover:bg-transparent'}`}
              onClick={() => setViewMode('kanban')}
            >
              <Columns3 className="h-3.5 w-3.5" />
            </Button>
          </div>


        </div>
      </header>

      {/* Mobile FAB for adding tasks */}
      <Button
        size="icon"
        onClick={() => setShowCreateTask(true)}
        className="fixed bottom-6 left-6 z-40 h-14 w-14 rounded-2xl shadow-xl md:hidden bg-gradient-to-br from-primary to-primary-glow glow-primary hover:opacity-90 transition-all active:scale-95"
        data-tour="add-task-mobile"
      >
        <Plus className="h-6 w-6" />
      </Button>


      <CreateTaskModal open={showCreateTask} onClose={() => setShowCreateTask(false)} />
    </>
  );
}
