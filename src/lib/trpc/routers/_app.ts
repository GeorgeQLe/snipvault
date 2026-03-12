import { router } from '../trpc';
import { snippetRouter } from './snippet';
import { collectionRouter } from './collection';
import { tagRouter } from './tag';
import { searchRouter } from './search';
import { billingRouter } from './billing';

export const appRouter = router({
  snippet: snippetRouter,
  collection: collectionRouter,
  tag: tagRouter,
  search: searchRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
