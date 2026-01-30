export const VIEW_KEYS = [
  'home',
  'home/about',
  'home/contact',
  'dashboard',
  'dashboard/stats',
  'dashboard/settings',
  'help'
] as const;

export type ViewKey = typeof VIEW_KEYS[number];

export interface SearchParams {
  left: ViewKey;
  right: ViewKey;
}

export interface ViewComponentProps {
  panelId: 'left' | 'right';
  currentPath: string;
}