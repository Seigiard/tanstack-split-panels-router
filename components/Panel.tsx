import React from 'react';
import { useSearch } from '@tanstack/react-router';
import { rootRoute, routeMap } from '../router';
import { NotFoundView } from '../views/registry';
import { PanelNav } from './PanelNav';
import { Badge } from './ui/badge';
import { ViewKey } from '../types';

interface PanelProps {
  id: 'left' | 'right';
  title: string;
}

export const Panel: React.FC<PanelProps> = ({ id, title }) => {
  const search = useSearch({ from: rootRoute.id });
  const currentPath = search[id] as ViewKey;

  const route = routeMap[currentPath];
  const ViewComponent = route?.options.component || NotFoundView;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/50 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
            {title} Panel
          </h2>
          <Badge variant="outline" className="font-mono text-xs">
            ?{id}={currentPath}
          </Badge>
        </div>

        <PanelNav panelId={id} currentPath={currentPath} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ViewComponent panelId={id} currentPath={currentPath} />
        </div>
      </div>
    </div>
  );
};
