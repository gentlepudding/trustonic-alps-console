import type { TenantId } from '../tenant/TenantContext';

import { useMutation } from './useMutation';
import type { MutationOptions, UseMutationResult } from './useMutation';
import { useTenant } from './useTenant';

export function useTenantMutation<TData, TVariables extends object>(
  query: string,
  options: MutationOptions<TVariables>,
): UseMutationResult<TData, TVariables> {
  const { tenantId } = useTenant();

  type ScopedVariables = TVariables & { tenantId: TenantId };

  const { mutateData: mutateScoped, ...result } = useMutation<
    TData,
    ScopedVariables
  >(query, {
    ...options,
    variables: {
      ...options.variables,
      tenantId,
    } as ScopedVariables,
  });

  const mutateData = (variables?: TVariables, replace = false) => {
    return mutateScoped(
      {
        ...variables,
        tenantId,
      } as ScopedVariables,
      replace,
    );
  };

  return {
    ...result,
    mutateData,
  };
}
