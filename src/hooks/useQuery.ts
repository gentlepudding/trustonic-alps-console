import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  acquireQuery,
  invalidateQuery,
  readCachedResponse,
} from '../api/queryCache';
import { serializeVariables } from '../api/serializeVariables';

export type QueryOptions<TVariables> = {
  variables?: TVariables;
  fetchFirst?: boolean;
  queryKey?: string;
};

export type UseQueryResult<TData, TVariables> = {
  loading: boolean;
  errors: string[];
  data: TData | undefined;
  refetch: (variables?: TVariables, replace?: boolean) => Promise<void>;
  reset: (queryKey?: string) => void;
};

export function useQuery<TData, TVariables>(
  query: string,
  options: QueryOptions<TVariables>,
): UseQueryResult<TData, TVariables> {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<
    | {
        cacheKey: string;
        data: TData | undefined;
      }
    | undefined
  >(undefined);

  const requestIdRef = useRef(0);
  const releaseRef = useRef<(() => void) | undefined>(undefined);
  const queryKey = options.queryKey;
  const variablesKey = serializeVariables(options.variables);

  const configuredVariables = useMemo<TVariables | undefined>(
    () => (variablesKey === undefined ? undefined : JSON.parse(variablesKey)),
    [variablesKey],
  );

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      releaseRef.current?.();
      releaseRef.current = undefined;
    };
  }, []);

  const execute = useCallback(
    async (
      variables?: TVariables,
      replace = false,
      force = false,
    ): Promise<void> => {
      const requestId = ++requestIdRef.current;

      releaseRef.current?.();
      releaseRef.current = undefined;

      const requestVariables = replace
        ? variables
        : ({
            ...configuredVariables,
            ...variables,
          } as TVariables);

      setLoading(true);
      setErrors([]);

      let release: (() => void) | undefined;

      try {
        const request = acquireQuery<TData, TVariables>(
          query,
          requestVariables,
          queryKey,
          force,
        );

        release = request.release;
        releaseRef.current = release;

        const response = await request.promise;

        if (requestId !== requestIdRef.current) return;

        setSnapshot({
          cacheKey: request.cacheKey,
          data: response.data ?? undefined,
        });
        setErrors(response.errors?.map((error) => error.message) ?? []);
      } catch (error: unknown) {
        if (requestId !== requestIdRef.current) return;
        if (error instanceof Error && error.name === 'AbortError') return;

        setErrors([error instanceof Error ? error.message : String(error)]);
      } finally {
        release?.();

        if (requestId === requestIdRef.current) {
          releaseRef.current = undefined;
          setLoading(false);
        }
      }
    },
    [query, configuredVariables, queryKey],
  );

  const refetch = useCallback(
    (variables?: TVariables, replace = false) => {
      return execute(variables, replace, true);
    },
    [execute],
  );

  useEffect(() => {
    if (options.fetchFirst) {
      void execute();
    }
  }, [options.fetchFirst, execute]);

  const reset = useCallback(
    (key?: string) => {
      requestIdRef.current += 1;
      releaseRef.current?.();
      releaseRef.current = undefined;

      const targetKey = key ?? queryKey;

      if (targetKey !== undefined) {
        invalidateQuery(targetKey);
      }

      setLoading(false);
      setErrors([]);
      setSnapshot(undefined);
    },
    [queryKey],
  );

  const cachedResponse =
    snapshot === undefined
      ? undefined
      : readCachedResponse<TData>(snapshot.cacheKey);

  const data =
    cachedResponse === undefined
      ? snapshot?.data
      : (cachedResponse.data ?? undefined);

  return {
    loading,
    errors,
    data,
    refetch,
    reset,
  };
}
