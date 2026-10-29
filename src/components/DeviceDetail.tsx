import { DEVICE_DETAIL } from '../api/deviceDetail';
import type {
  DeviceDetailData,
  DeviceDetailVariables,
} from '../api/deviceDetail';
import { useTenantQuery } from '../hooks/useTenantQuery';
import type { DeviceAction } from '../api/deviceActions';
import type { DeviceStateOverride } from '../hooks/useDeviceLock';
import { DeviceLockButton } from './DeviceLockButton';

type DeviceDetailProps = {
  deviceId: string;
  override?: DeviceStateOverride;
  lockError?: string;
  onLock: (deviceId: string, action: DeviceAction) => Promise<boolean>;
};

export function DeviceDetail({
  deviceId,
  override,
  lockError,
  onLock,
}: DeviceDetailProps) {
  const { data, loading, errors } = useTenantQuery<
    DeviceDetailData,
    DeviceDetailVariables
  >(DEVICE_DETAIL, {
    variables: { deviceId },
    fetchFirst: true,
    queryKey: `device:${deviceId}:detail`,
  });

  const device = data?.deviceDetail;
  const displayedState = override?.state ?? device?.state;

  return (
    <section aria-label="Device details" aria-busy={loading}>
      <h2>Device details</h2>

      {loading && <p role="status">Loading device…</p>}

      {errors.length > 0 && <p role="alert">{errors.join('; ')}</p>}

      {!loading && errors.length === 0 && !device && (
        <p>Device details unavailable.</p>
      )}

      {device && (
        <dl>
          <dt>Serial number</dt>
          <dd>{device.serialNumber ?? 'Unavailable'}</dd>

          <dt>Brand</dt>
          <dd>{device.deviceBrandName ?? 'Unavailable'}</dd>

          <dt>Model</dt>
          <dd>{device.deviceModelMarketingName ?? 'Unavailable'}</dd>

          <dt>State</dt>
          <dd>
            {displayedState?.name ?? 'Unavailable'}
            {override?.pending && ' (pending)'}
          </dd>

          <dt>IMSI</dt>
          <dd>{device.imsi ?? 'Unavailable'}</dd>

          <dt>Policy</dt>
          <dd>{device.policy?.name ?? 'Unavailable'}</dd>
        </dl>
      )}
      {device?.state && (
        <DeviceLockButton
          key={device.state.id}
          deviceId={deviceId}
          stateId={device.state.id}
          pending={override?.pending ?? false}
          locked={displayedState?.id === 3}
          error={lockError}
          onLock={onLock}
        />
      )}
    </section>
  );
}
