'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Client-side request helper for forms and buttons.
export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async (path, { method = 'GET', body } = {}) => {
      const token = await getToken();
      let res;
      try {
        res = await fetch(`${API_URL}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch {
        throw new Error("Can't reach the backend. Check your connection and try again.");
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `The backend returned an error (${res.status}).`);
      return data;
    },
    [getToken]
  );
}
