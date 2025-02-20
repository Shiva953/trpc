import { inferRouterOutputs, initTRPC } from '@trpc/server';
import { z } from 'zod';

/**
 * See @sentry/node trpc middleware:
 * https://github.com/getsentry/sentry-javascript/blob/6d424571e3cd5e99991b711f4e23d773e321e294/packages/node/src/handlers.ts#L328
 */
interface TrpcMiddlewareArguments<T> {
  path: string;
  type: string;
  next: () => T;
  rawInput: unknown;
}

/**
 * See @sentry/node trpc middleware:
 * https://github.com/getsentry/sentry-javascript/blob/6d424571e3cd5e99991b711f4e23d773e321e294/packages/node/src/handlers.ts#L328
 */
function sentryTrpcMiddleware(_options: any) {
  return function <T>({
    path,
    type,
    next,
    rawInput,
  }: TrpcMiddlewareArguments<T>): T {
    path;
    type;
    next;
    rawInput;

    // This function is effectively what @sentry/node does to provide its trpc middleware.
    return null as any as T;
  };
}

type Context = {
  some: 'prop';
};

describe('context inference w/ middlewares', () => {
  test('a base procedure using a generically constructed middleware should be extensible using another middleware', async () => {
    const t = initTRPC.context<Context>().create();

    const baseMiddleware = t.middleware(sentryTrpcMiddleware({ foo: 'bar' }));

    const someMiddleware = t.middleware(async (opts) => {
      return opts.next({
        ctx: {
          object: {
            a: 'b',
          },
        },
      });
    });

    const baseProcedure = t.procedure.use(baseMiddleware);
    const bazQuxProcedure = baseProcedure.use(someMiddleware);

    const appRouter = t.router({
      foo: bazQuxProcedure.input(z.string()).query(({ ctx }) => ctx),
    });
    type Output = inferRouterOutputs<typeof appRouter>['foo'];

    expectTypeOf<Output>().toEqualTypeOf<{
      object: { a: string };
      some: 'prop';
    }>();
  });
});
