import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Server-side request to the backend, sending the admin's Clerk token.
export async function apiServer(path, { method = 'GET', body, searchParams } = {}) {
  const { getToken } = await auth();
  const token = await getToken();

  const url = new URL(path, API_URL);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    }
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new Error(
      "Can't reach the backend. If it's on Render's free plan it may be waking up, so refresh in about a minute."
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `The backend returned an error (${res.status}).`);
  return data;
}

// Same as apiServer but returns { data, error } so pages can show a message instead of crashing.
export async function tryApi(path, options) {
  try {
    return { data: await apiServer(path, options), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
