import { LIST_AVAILABLE_ACTIONS } from '../api/deviceActions';
import type {
  AvailableActionsData,
  AvailableActionsVariables,
  DeviceAction,
} from '../api/deviceActions';
import { useTenantQuery } from '../hooks/useTenantQuery';

type DeviceLockButtonProps = {
  deviceId: string;
  stateId: number;
  pending: boolean;
  locked: boolean;
  error?: string;
  onLock: (deviceId: string, action: DeviceAction) => Promise<boolean>;
};

export function DeviceLockButton({
  deviceId,
  stateId,
  pending,
  locked,
  error,
  onLock,
}: DeviceLockButtonProps) {
  const { data, loading, errors } = useTenantQuery<
    AvailableActionsData,
    AvailableActionsVariables
  >(LIST_AVAILABLE_ACTIONS, {
    variables: { stateId: String(stateId) },
    fetchFirst: true,
    queryKey: `actions:${stateId}`,
  });

  const lockAction = data?.listAvailableActions?.find(
    (action) => action?.stateId === 3,
  );

  return (
    <div>
      {loading && <p role="status">Loading available actions…</p>}

      {errors.length > 0 && <p role="alert">{errors.join('; ')}</p>}

      {!locked && (
        <button
          type="button"
          disabled={
            loading || errors.length > 0 || pending || locked || !lockAction
          }
          onClick={() => {
            if (lockAction) {
              void onLock(deviceId, lockAction);
            }
          }}
        >
          {pending ? 'Locking…' : 'Lock device'}
        </button>
      )}

      {!loading &&
        errors.length === 0 &&
        !locked &&
        !pending &&
        !lockAction && <p>Lock action unavailable.</p>}

      {locked && !pending && (
        <p className="lock-status" role="status">
          Device is locked
        </p>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
