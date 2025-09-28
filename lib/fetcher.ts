import { HttpMethod } from '@/types';
import deepmerge from 'deepmerge';

export async function fetcher<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON | null> {
  const finalOptions = deepmerge(
    {
      method: HttpMethod.GET,
      credentials: 'include',
      headers:
        init?.body instanceof FormData
          ? {}
          : {
              'Content-Type': 'application/json',
            },
    },
    init ?? {}
  );

  const response = await fetch(input, finalOptions);

  if (!response.ok) {
    return null;
  }

  // Sometime the body can be empty, and the json() will fail
  if (response.status === 204 || response.statusText === 'No Content') {
    return null;
  }

  return await response.json();
}
