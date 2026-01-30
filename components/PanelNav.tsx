import React from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { rootRoute } from '../router';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface PanelNavProps {
  panelId: 'left' | 'right';
  currentPath: string;
}

export const PanelNav: React.FC<PanelNavProps> = ({ panelId, currentPath }) => {
  const navigate = useNavigate({ from: rootRoute.id });
  const search = useSearch({ from: rootRoute.id });

  const parentPath = currentPath.includes('/')
    ? currentPath.split('/').slice(0, -1).join('/')
    : null;

  const navigateTo = (newPath: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        [panelId]: newPath,
      }),
    });
  };

  const navItems = [
    { label: 'Home', path: 'home' },
    { label: 'Dash', path: 'dashboard' },
    { label: 'Help', path: 'help' },
  ];

  const subItems: Record<string, { label: string; path: string }[]> = {
    home: [
      { label: 'About', path: 'home/about' },
      { label: 'Contact', path: 'home/contact' },
    ],
    dashboard: [
      { label: 'Stats', path: 'dashboard/stats' },
      { label: 'Settings', path: 'dashboard/settings' },
    ],
  };

  const relevantSubItems = subItems[currentPath] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm h-8">
        {parentPath && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo(parentPath)}
            className="gap-1 pr-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          Current: <span className="text-primary">{currentPath}</span>
        </span>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'secondary'}
              size="sm"
              onClick={() => navigateTo(item.path)}
            >
              {item.label}
            </Button>
          );
        })}
      </div>

      {relevantSubItems.length > 0 && (
        <div className="flex flex-col gap-2 bg-muted/50 p-3 rounded-lg border border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">
            Available Sub-Pages
          </span>
          <div className="flex flex-wrap gap-2">
            {relevantSubItems.map((sub) => (
              <Button
                key={sub.path}
                variant="outline"
                size="sm"
                onClick={() => navigateTo(sub.path)}
                className="gap-1"
              >
                {sub.label}
                <ChevronRight className="w-3 h-3" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
