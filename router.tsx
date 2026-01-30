import { 
  createRootRoute, 
  createRoute, 
  createRouter, 
} from '@tanstack/react-router';
import { Layout } from './components/Layout';
import { SearchParams, VIEW_KEYS, ViewKey } from './types';
import * as Views from './views/registry';

// 1. Define the Root Route
// We strictly validate the search params using the VIEW_KEYS constant.
export const rootRoute = createRootRoute({
  component: Layout,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const left = (typeof search.left === 'string' && VIEW_KEYS.includes(search.left as ViewKey))
      ? search.left as ViewKey
      : 'home';
    const right = (typeof search.right === 'string' && VIEW_KEYS.includes(search.right as ViewKey))
      ? search.right as ViewKey
      : 'dashboard';
      
    return { left, right };
  },
});

// 2. Define Routes for each View
// By using createRoute, we gain access to TanStack Router's typing and features (like loaders) if needed later.
// These routes are "flat" siblings of root for this architecture, mapped by their path string.

const homeRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: 'home', 
  component: Views.HomeView 
});

const homeAboutRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: 'home/about', 
  component: Views.AboutView 
});

const homeContactRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: 'home/contact', 
  component: Views.ContactView 
});

const dashboardRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: 'dashboard', 
  component: Views.DashboardView 
});

const dashboardStatsRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: 'dashboard/stats', 
  component: Views.StatsView 
});

const dashboardSettingsRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: 'dashboard/settings', 
  component: Views.SettingsView 
});

const helpRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: 'help', 
  component: Views.HelpView 
});

// 3. Index Route (Fallback)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null,
});

// 4. Create a Route Map for Component Lookup
// This replaces the old VIEW_REGISTRY.
export const routeMap = {
  'home': homeRoute,
  'home/about': homeAboutRoute,
  'home/contact': homeContactRoute,
  'dashboard': dashboardRoute,
  'dashboard/stats': dashboardStatsRoute,
  'dashboard/settings': dashboardSettingsRoute,
  'help': helpRoute,
} as const;

// 5. Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  ...Object.values(routeMap)
]);

// 6. Create the router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
} as any);