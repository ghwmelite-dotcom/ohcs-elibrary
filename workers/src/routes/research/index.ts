import { Hono } from 'hono';
import type { Env, Variables } from './helpers';
import { optionalAuth } from './helpers';
import projects from './projects';
import collaboration from './collaboration';
import ai from './ai';
import exports from './exports';
import governance from './governance';
import search from './search';
import templates from './templates';
import milestones from './milestones';

const researchRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
researchRoutes.use('*', optionalAuth);

// Mount sub-routes
researchRoutes.route('/', projects);
researchRoutes.route('/', collaboration);
researchRoutes.route('/', ai);
researchRoutes.route('/', exports);
researchRoutes.route('/', governance);
researchRoutes.route('/', search);
researchRoutes.route('/', templates);
researchRoutes.route('/', milestones);

export { researchRoutes };
