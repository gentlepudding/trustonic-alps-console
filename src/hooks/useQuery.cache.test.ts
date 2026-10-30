import { act, renderHook, waitFor } from '@testing-library/react';
import { graphql, HttpResponse } from 'msw';
import { afterEach, expect, test } from 'vitest';

import { invalidateQuery, updateCachedQueries } from '../api/queryCache';
import { server } from '../test/setup';

import { useQuery } from './useQuery';

type DetailData = {
  deviceDetail: {
    id: string;
    state: { id: number; name: string };
  };
};

type DetailVariables = {
  tenantId: string;
  deviceId: string;
};

const QUERY = `
  query DeviceDetail($tenantId: String!, $deviceId: String!) {
    deviceDetail(tenantId: $tenantId, deviceId: $deviceId) {
      id
      state { id name }
    }
  }
`;

function useDetail(tenantId: string) {
  return useQuery<DetailData, DetailVariables>(QUERY, {
    variables: { tenantId, deviceId: 'shared-device' },
    fetchFirst: true,
    queryKey: `cache-review:${tenantId}`,
  });
}

afterEach(() => {
  invalidateQuery('cache-review:tenant-alpha');
  invalidateQuery('cache-review:tenant-beta');
});

test('notifies independent consumers of a cache patch without affecting another tenant', async () => {
  const requests: string[] = [];

  server.use(
    graphql
      .link('http://localhost:3000/graphql')
      .query('DeviceDetail', ({ variables }) => {
        requests.push(String(variables.tenantId));

        return HttpResponse.json({
          data: {
            deviceDetail: {
              id: String(variables.deviceId),
              state: { id: 2, name: 'ACTIVE' },
            },
          },
        });
      }),
  );

  const first = renderHook(() => useDetail('tenant-alpha'));
  const second = renderHook(() => useDetail('tenant-alpha'));
  const otherTenant = renderHook(() => useDetail('tenant-beta'));

  await waitFor(() => {
    expect(first.result.current.data?.deviceDetail.state.name).toBe('ACTIVE');
    expect(second.result.current.data?.deviceDetail.state.name).toBe('ACTIVE');
    expect(otherTenant.result.current.data?.deviceDetail.state.name).toBe(
      'ACTIVE',
    );
  });

  act(() => {
    updateCachedQueries<DetailData, DetailVariables>(
      'cache-review:tenant-alpha',
      (data) => ({
        ...data,
        deviceDetail: {
          ...data.deviceDetail,
          state: { id: 3, name: 'LOCKED' },
        },
      }),
    );
  });

  expect(first.result.current.data?.deviceDetail.state.name).toBe('LOCKED');
  expect(second.result.current.data?.deviceDetail.state.name).toBe('LOCKED');
  expect(otherTenant.result.current.data?.deviceDetail.state.name).toBe(
    'ACTIVE',
  );
  expect(requests.filter((tenant) => tenant === 'tenant-alpha')).toHaveLength(
    1,
  );
  expect(requests.filter((tenant) => tenant === 'tenant-beta')).toHaveLength(1);
});

test('keeps consumers subscribed when refetch replaces their cache entry', async () => {
  let state = { id: 2, name: 'ACTIVE' };
  let requestCount = 0;

  server.use(
    graphql
      .link('http://localhost:3000/graphql')
      .query('DeviceDetail', ({ variables }) => {
        requestCount += 1;

        return HttpResponse.json({
          data: {
            deviceDetail: { id: String(variables.deviceId), state },
          },
        });
      }),
  );

  const first = renderHook(() => useDetail('tenant-alpha'));
  const second = renderHook(() => useDetail('tenant-alpha'));

  await waitFor(() => {
    expect(first.result.current.data?.deviceDetail.state.name).toBe('ACTIVE');
    expect(second.result.current.data?.deviceDetail.state.name).toBe('ACTIVE');
  });

  state = { id: 3, name: 'LOCKED' };

  await act(async () => {
    await first.result.current.refetch();
  });

  expect(second.result.current.data?.deviceDetail.state.name).toBe('LOCKED');
  expect(requestCount).toBe(2);

  act(() => {
    updateCachedQueries<DetailData, DetailVariables>(
      'cache-review:tenant-alpha',
      (data) => ({
        ...data,
        deviceDetail: {
          ...data.deviceDetail,
          state: { id: 4, name: 'RELEASED' },
        },
      }),
    );
  });

  expect(first.result.current.data?.deviceDetail.state.name).toBe('RELEASED');
  expect(second.result.current.data?.deviceDetail.state.name).toBe('RELEASED');
  expect(requestCount).toBe(2);
});
