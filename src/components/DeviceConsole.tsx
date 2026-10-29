import { useEffect, useState } from 'react';
import { LIST_DEVICES } from '../api/devices';
import type {
  DeviceListItem,
  ListDevicesData,
  ListDevicesVariables,
} from '../api/devices';
import { useTenantQuery } from '../hooks/useTenantQuery';
import { DeviceDetail } from './DeviceDetail';
import { DeviceHistory } from './DeviceHistory';
import { useDeviceLock } from '../hooks/useDeviceLock';

type SearchField = 'serialNumber' | 'imei';

export function DeviceConsole() {
  const [searchInput, setSearchInput] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('serialNumber');

  const [listParams, setListParams] = useState({
    page: 1,
    search: '',
  });
  const [stateId, setStateId] = useState<number | undefined>(undefined);

  const [selectedDevice, setSelectedDevice] = useState<
    DeviceListItem | undefined
  >(undefined);

  const selectedDeviceId = selectedDevice?.id;

  const { page, search } = listParams;
  const pageSize = 10;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim();

      setListParams((current) =>
        current.search === nextSearch
          ? current
          : { page: 1, search: nextSearch },
      );
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const {
    data,
    loading,
    errors,
    refetch: refetchDevices,
  } = useTenantQuery<ListDevicesData, ListDevicesVariables>(LIST_DEVICES, {
    variables: {
      page,
      pageSize,
      stateId,
      [searchField]: search || undefined,
    },
    fetchFirst: true,
    queryKey: 'devices',
  });

  const devices = data?.listDevices?.deviceList;
  const hasDevices = devices?.some((device) => device !== null) ?? false;

  const totalCount = data?.listDevices?.pageInfo?.total_count;

  const pageCount =
    totalCount == null
      ? undefined
      : Math.max(1, Math.ceil(totalCount / pageSize));
  const { overrides, lockErrors, lockDevice, revisions } = useDeviceLock();
  const hasPendingLock = Object.values(overrides).some(
    (override) => override?.pending,
  );

  const filteredResultsChanged =
    stateId !== undefined && Object.keys(revisions).length > 0;

  const pageOutOfRange = pageCount !== undefined && page > pageCount;

  return (
    <div className="device-layout">
      <section aria-label="Devices" aria-busy={loading}>
        <h2>Devices</h2>

        <div className="device-controls">
          <label>
            Search by
            <select
              value={searchField}
              onChange={(event) => {
                const value = event.target.value;

                if (value === 'serialNumber' || value === 'imei') {
                  setSearchField(value);
                  setListParams((current) => ({
                    ...current,
                    page: 1,
                  }));
                }
              }}
            >
              <option value="serialNumber">Serial number</option>
              <option value="imei">IMEI</option>
            </select>
          </label>

          <label>
            Search
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={
                searchField === 'imei' ? 'Enter IMEI' : 'Enter serial number'
              }
            />
          </label>
          <label>
            State
            <select
              value={stateId ?? ''}
              onChange={(event) => {
                const value = event.target.value;

                setStateId(value === '' ? undefined : Number(value));
                setListParams((current) => ({
                  ...current,
                  page: 1,
                }));
              }}
            >
              <option value="">All states</option>
              <option value="1">Enrolled</option>
              <option value="2">Active</option>
              <option value="3">Locked</option>
              <option value="4">Released</option>
            </select>
          </label>
          <button
            type="button"
            disabled={loading || hasPendingLock}
            onClick={() => {
              void refetchDevices();
            }}
          >
            Refresh list
          </button>
        </div>
        {filteredResultsChanged && (
          <p>
            Device states changed. Refresh the filtered results to update page
            boundaries.
          </p>
        )}

        {pageOutOfRange && (
          <div>
            <p>This page is no longer available after the state change.</p>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setListParams((current) => ({
                  ...current,
                  page: 1,
                }));
              }}
            >
              Go to first page
            </button>
          </div>
        )}

        {loading && <p role="status">Loading devices…</p>}

        {errors.length > 0 && <p role="alert">{errors.join('; ')}</p>}

        {!loading && errors.length === 0 && !hasDevices && (
          <p>No devices found.</p>
        )}

        {hasDevices && (
          <table>
            <caption>Devices for the selected tenant</caption>

            <thead>
              <tr>
                <th scope="col">Serial number</th>
                <th scope="col">Primary IMEI</th>
                <th scope="col">Model</th>
                <th scope="col">State</th>
                <th scope="col">Last check-in</th>
              </tr>
            </thead>

            <tbody>
              {devices?.map((device) => {
                if (device === null) return null;
                const override = overrides[device.id];
                const displayedState = override?.state ?? device.state;
                if (device === null) return null;

                const primaryImei = device.IMEIs?.find(
                  (imei) => imei?.isPrimary === true,
                )?.imei;

                return (
                  <tr key={device.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedDevice(device)}
                      >
                        {device.serialNumber ?? device.id}
                      </button>
                    </td>
                    <td>{primaryImei ?? 'Unavailable'}</td>
                    <td>{device.modelMarketingName ?? 'Unavailable'}</td>
                    <td>
                      {displayedState?.name ?? 'Unavailable'}
                      {override?.pending && ' (pending)'}
                    </td>
                    <td>
                      {device.lastCheckin
                        ? new Date(device.lastCheckin).toLocaleString('en-GB')
                        : 'Unavailable'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <nav aria-label="Device list pagination">
          <button
            type="button"
            disabled={loading || page === 1}
            onClick={() =>
              setListParams((current) => ({
                ...current,
                page: Math.max(1, current.page - 1),
              }))
            }
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
            onClick={() =>
              setListParams((current) => ({
                ...current,
                page: current.page + 1,
              }))
            }
          >
            Next
          </button>
        </nav>
      </section>
      <aside className="device-detail-panel" aria-label="Selected device">
        {selectedDeviceId ? (
          <div key={`${selectedDeviceId}:${revisions[selectedDeviceId] ?? 0}`}>
            <DeviceDetail
              deviceId={selectedDeviceId}
              override={overrides[selectedDeviceId]}
              lockError={lockErrors[selectedDeviceId]}
              onLock={(deviceId, action) => {
                if (selectedDevice?.id !== deviceId) {
                  return Promise.resolve(false);
                }

                return lockDevice(selectedDevice, action);
              }}
            />
            <DeviceHistory deviceId={selectedDeviceId} />
          </div>
        ) : (
          <p>Select a device to view its details.</p>
        )}
      </aside>
    </div>
  );
}
