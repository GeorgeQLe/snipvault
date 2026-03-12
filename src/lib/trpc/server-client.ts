import { createCallerFactory } from './trpc';
import { appRouter } from './routers/_app';
import { createContext } from './context';

const createCaller = createCallerFactory(appRouter);

export async function createServerClient() {
  const context = await createContext();
  return createCaller(context);
}
