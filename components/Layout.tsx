import React from 'react';
import { Separator } from './ui/separator';
import { Panel } from './Panel';

export const Layout: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background text-foreground overflow-hidden">
      <div className="flex-1 min-w-0 border-b md:border-b-0 md:border-r border-border">
        <Panel id="left" title="Left" />
      </div>

      <Separator orientation="vertical" className="hidden md:block" />

      <div className="flex-1 min-w-0">
        <Panel id="right" title="Right" />
      </div>
    </div>
  );
};
