import { useRef, useState } from 'react';

import { graphqlRequest } from '../api/graphql';

export type MutationOptions<TVariables> = {
  variables?: TVariables;
  throwError?: boolean;
};

export type UseMutationResult<TData, TVariables> = {
  loading: boolean;
  errors: string[];
  mutateData: (
    variables?: TVariables,
    replace?: boolean,
  ) => Promise<TData | undefined>;
};

export function useMutation<TData, TVariables>(
  query: string,
  options: MutationOptions<TVariables>,
): UseMutationResult<TData, TVariables> {
  const [pendingCount, setPendingCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const requestIdRef = useRef(0);

  const mutateData = async (
    variables?: TVariables,
    replace = false,
  ): Promise<TData | undefined> => {
    const requestId = ++requestIdRef.current;

    const requestVariables = replace
      ? variables
      : ({
          ...options.variables,
          ...variables,
        } as TVariables);

    setPendingCount((current) => current + 1);
    setErrors([]);

    try {
      const response = await graphqlRequest<TData, TVariables>(
        query,
        requestVariables,
      );

      const messages = response.errors?.map((error) => error.message) ?? [];

      if (messages.length > 0) {
        if (options.throwError) {
          throw new Error(messages.join('; '));
        }

        if (requestId === requestIdRef.current) {
          setErrors(messages);
        }
      }

      return response.data ?? undefined;
    } catch (error: unknown) {
      const mutationError =
        error instanceof Error ? error : new Error(String(error));

      if (options.throwError) {
        throw mutationError;
      }

      if (requestId === requestIdRef.current) {
        setErrors([mutationError.message]);
      }

      return undefined;
    } finally {
      setPendingCount((current) => current - 1);
    }
  };

  return {
    loading: pendingCount > 0,
    errors,
    mutateData,
  };
}
