import { graphqlRequest } from './graphql';
import type { GraphQLResponse } from './graphql';
import { serializeVariables } from './serializeVariables';

const CACHE_TTL = 30_000;

type CacheEntry = {
  promise: Promise<GraphQLResponse<unknown>>;
  controller: AbortController;
  consumers: Set<symbol>;
  queryKeys: Set<string>;
  settled: boolean;
  expiresAt: number;
  variables: unknown;
  response?: GraphQLResponse<unknown>;
};

const cache = new Map<string, CacheEntry>();

export function acquireQuery<TData, TVariables>(
  query: string,
  variables?: TVariables,
  queryKey?: string,
  force = false,
) {
  const cacheKey = JSON.stringify([query, serializeVariables(variables)]);

  let entry = cache.get(cacheKey);

  if (entry?.settled && (force || entry.expiresAt <= Date.now())) {
    cache.delete(cacheKey);
    entry = undefined;
  }
  if (!entry) {
    const controller = new AbortController();

    const newEntry: CacheEntry = {
      promise: graphqlRequest<TData, TVariables>(
        query,
        variables,
        controller.signal,
      ),
      controller,
      consumers: new Set(),
      queryKeys: new Set(),
      settled: false,
      expiresAt: 0,
      variables,
    };

    newEntry.promise = newEntry.promise.then(
      (response) => {
        newEntry.settled = true;
        newEntry.response = response;
        newEntry.expiresAt = Date.now() + CACHE_TTL;

        if (response.data == null && cache.get(cacheKey) === newEntry) {
          cache.delete(cacheKey);
        }

        return response;
      },
      (error: unknown) => {
        newEntry.settled = true;

        if (cache.get(cacheKey) === newEntry) {
          cache.delete(cacheKey);
        }

        throw error;
      },
    );

    cache.set(cacheKey, newEntry);
    entry = newEntry;
  }

  const activeEntry = entry;
  const consumerId = Symbol();

  activeEntry.consumers.add(consumerId);

  if (queryKey !== undefined) {
    activeEntry.queryKeys.add(queryKey);
  }

  const release = () => {
    activeEntry.consumers.delete(consumerId);

    if (!activeEntry.settled && activeEntry.consumers.size === 0) {
      if (cache.get(cacheKey) === activeEntry) {
        cache.delete(cacheKey);
      }

      activeEntry.controller.abort();
    }
  };

  return {
    cacheKey,
    promise: activeEntry.promise as Promise<GraphQLResponse<TData>>,
    release,
  };
}

export function invalidateQuery(queryKey: string) {
  for (const [cacheKey, entry] of cache) {
    if (entry.queryKeys.has(queryKey)) {
      cache.delete(cacheKey);

      if (!entry.settled) {
        entry.controller.abort();
      }
    }
  }
}

export function readCachedResponse<TData>(
  cacheKey: string,
): GraphQLResponse<TData> | undefined {
  return cache.get(cacheKey)?.response as GraphQLResponse<TData> | undefined;
}

export function updateCachedQueries<TData, TVariables>(
  queryKey: string,
  update: (data: TData, variables: TVariables) => TData | undefined,
) {
  for (const [cacheKey, entry] of cache) {
    if (!entry.queryKeys.has(queryKey)) continue;
    if (entry.response?.data == null) continue;

    const nextData = update(
      entry.response.data as TData,
      entry.variables as TVariables,
    );

    if (nextData === undefined) {
      cache.delete(cacheKey);
      continue;
    }

    const nextResponse = {
      ...entry.response,
      data: nextData,
    };

    entry.response = nextResponse;
    entry.promise = Promise.resolve(nextResponse);
  }
}
