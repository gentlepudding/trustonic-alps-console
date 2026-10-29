import { renderHook, waitFor } from '@testing-library/react';
import { graphql, HttpResponse } from 'msw';
import { expect, test } from 'vitest';

import { invalidateQuery } from '../api/queryCache';
import { server } from '../test/setup';

import { useQuery } from './useQuery';

type TestData = {
  deviceDetail: {
    id: string;
  };
};

type TestVariables = {
  tenantId: string;
  deviceId: string;
};

const QUERY = `
  query DeviceDetail($tenantId: String!, $deviceId: String!) {
    deviceDetail(tenantId: $tenantId, deviceId: $deviceId) {
      id
    }
  }
`;

test('keeps the newer result when an older response arrives last', async () => {
  let releaseOldResponse!: () => void;
  let oldRequestCount = 0;

  const oldResponseGate = new Promise<void>((resolve) => {
    releaseOldResponse = resolve;
  });

  const endpoint = graphql.link('http://localhost:3000/graphql');

  server.use(
    endpoint.query('DeviceDetail', async ({ variables }) => {
      if (variables.deviceId === 'device-a') {
        oldRequestCount += 1;
        await oldResponseGate;
      }

      return HttpResponse.json({
        data: {
          deviceDetail: {
            id: String(variables.deviceId),
          },
        },
      });
    }),
  );

  try {
    const main = renderHook(
      ({ deviceId }) =>
        useQuery<TestData, TestVariables>(QUERY, {
          variables: { tenantId: 'tenant-alpha', deviceId },
          fetchFirst: true,
          queryKey: 'race-test',
        }),
      {
        initialProps: { deviceId: 'device-a' },
      },
    );

    const secondConsumer = renderHook(() =>
      useQuery<TestData, TestVariables>(QUERY, {
        variables: {
          tenantId: 'tenant-alpha',
          deviceId: 'device-a',
        },
        fetchFirst: true,
        queryKey: 'race-test',
      }),
    );

    await waitFor(() => {
      expect(oldRequestCount).toBe(1);
    });

    main.rerender({ deviceId: 'device-b' });

    await waitFor(() => {
      expect(main.result.current.data?.deviceDetail.id).toBe('device-b');
      expect(main.result.current.loading).toBe(false);
    });

    releaseOldResponse();

    await waitFor(() => {
      expect(secondConsumer.result.current.data?.deviceDetail.id).toBe(
        'device-a',
      );
    });

    expect(main.result.current.data?.deviceDetail.id).toBe('device-b');
    expect(main.result.current.errors).toEqual([]);
    expect(main.result.current.loading).toBe(false);
    expect(oldRequestCount).toBe(1);
  } finally {
    releaseOldResponse();
    invalidateQuery('race-test');
  }
});
