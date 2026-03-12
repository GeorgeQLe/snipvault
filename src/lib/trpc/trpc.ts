import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Middleware that enforces authentication.
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.workspaceId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to perform this action.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
