import { useState } from 'react';

import { LIST_DEVICE_HISTORY } from '../api/deviceHistory';
import type {
  DeviceHistoryData,
  DeviceHistoryVariables,
} from '../api/deviceHistory';
import { useTenantQuery } from '../hooks/useTenantQuery';

type DeviceHistoryProps = {
  deviceId: string;
};

export function DeviceHistory({ deviceId }: DeviceHistoryProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data, loading, errors } = useTenantQuery<
    DeviceHistoryData,
    DeviceHistoryVariables
  >(LIST_DEVICE_HISTORY, {
    variables: { deviceId, page, pageSize },
    fetchFirst: true,
    queryKey: `device:${deviceId}:history`,
  });

  const histories = data?.listDeviceHistory?.histories;
  const hasHistory = histories?.some((history) => history !== null) ?? false;
  const totalCount = data?.listDeviceHistory?.pageInfo?.total_count;
  const pageCount =
    totalCount == null
      ? undefined
      : Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <section
      className="history-section"
      aria-label="Device history"
      aria-busy={loading}
    >
      <h2>History</h2>

      {loading && <p role="status">Loading history…</p>}

      {errors.length > 0 && <p role="alert">{errors.join('; ')}</p>}

      {!loading && errors.length === 0 && !hasHistory && (
        <p>No history found.</p>
      )}

      <ul className="device-history">
        {histories?.map((history, index) => {
          if (history === null) return null;

          return (
            <li key={`${page}:${index}`}>
              <strong>{history.actionName ?? 'Event'}</strong>

              <p>{history.type ?? 'Unknown event type'}</p>

              <p>
                {history.policyName ?? 'Unavailable'}
                {' → '}
                {history.nextPolicyName ?? 'Unavailable'}
              </p>

              <p>
                {history.createdAt
                  ? new Date(history.createdAt).toLocaleString('en-GB')
                  : 'Timestamp unavailable'}
              </p>

              <p>{history.email ?? 'Operator unavailable'}</p>
            </li>
          );
        })}
      </ul>

      <nav aria-label="History pagination">
        <button
          type="button"
          disabled={loading || page === 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </button>

        <span>
          Page {page}
          {pageCount !== undefined && ` of ${pageCount}`}
        </span>

        <button
          type="button"
          disabled={loading || pageCount === undefined || page >= pageCount}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
