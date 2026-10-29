import { useCallback } from 'react';
import { useQuery } from './useQuery';
import type { QueryOptions, UseQueryResult } from './useQuery';
import { useTenant } from './useTenant';
import type { TenantId } from '../tenant/TenantContext';

export function useTenantQuery<TData, TVariables extends object>(
  query: string,
  options: QueryOptions<TVariables>,
): UseQueryResult<TData, TVariables> {
  const { tenantId } = useTenant();

  type ScopedVariables = TVariables & { tenantId: TenantId };

  const {
    refetch: refetchQuery,
    reset: resetQuery,
    ...result
  } = useQuery<TData, ScopedVariables>(query, {
    ...options,
    variables: {
      ...options.variables,
      tenantId,
    } as ScopedVariables,
    queryKey: options.queryKey ? `${tenantId}:${options.queryKey}` : undefined,
  });

  const refetch = useCallback(
    (variables?: TVariables, replace = false) => {
      return refetchQuery(
        {
          ...variables,
          tenantId,
        } as ScopedVariables,
        replace,
      );
    },
    [refetchQuery, tenantId],
  );

  const reset = useCallback(
    (queryKey?: string) => {
      resetQuery(
        queryKey === undefined ? undefined : `${tenantId}:${queryKey}`,
      );
    },
    [resetQuery, tenantId],
  );

  return {
    ...result,
    refetch,
    reset,
  };
}
