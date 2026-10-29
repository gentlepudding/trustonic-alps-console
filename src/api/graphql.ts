export type GraphQLError = {
  message: string;
  path?: Array<string | number>;
};

export type GraphQLResponse<TData> = {
  data?: TData | null;
  errors?: GraphQLError[];
};

export async function graphqlRequest<TData, TVariables>(
  query: string,
  variables?: TVariables,
  signal?: AbortSignal,
): Promise<GraphQLResponse<TData>> {
  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return (await response.json()) as GraphQLResponse<TData>;
}
