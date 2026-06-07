import { createMiddleware } from '@tanstack/react-start';
import { getRequestHeader, getCookie } from '@tanstack/react-start/server';
import { getUserFromToken } from '@server/auth';

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    let token: string | null = null;

    try {
      const auth = getRequestHeader('authorization');
      if (auth?.startsWith('Bearer ')) token = auth.slice(7);
    } catch {}

    if (!token) {
      try {
        token = getCookie('auth_token') ?? null;
      } catch {}
    }

    if (!token) throw new Error('Unauthorized — please sign in');

    const user = await getUserFromToken(token);
    if (!user) throw new Error('Session expired — please sign in again');

    return next({ userId: user.id, user });
  }
);
