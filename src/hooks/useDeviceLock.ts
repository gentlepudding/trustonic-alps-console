import { useRef, useState } from 'react';

import { ASSIGN_ACTION } from '../api/deviceActions';
import type {
  AssignActionData,
  AssignActionVariables,
  DeviceAction,
} from '../api/deviceActions';
import { invalidateQuery } from '../api/queryCache';
import { useTenant } from './useTenant';
import type { DeviceListItem } from '../api/devices';
import { updateDeviceLists } from '../api/updateDeviceLists';

import { useTenantMutation } from './useTenantMutation';

export type DeviceStateOverride = {
  state: {
    id: number;
    name: string;
  };
  pending: boolean;
};

export function useDeviceLock() {
  const { tenantId } = useTenant();

  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [overrides, setOverrides] = useState<
    Record<string, DeviceStateOverride | undefined>
  >({});
  const [lockErrors, setLockErrors] = useState<
    Record<string, string | undefined>
  >({});
  const pendingDevicesRef = useRef(new Set<string>());

  const { mutateData } = useTenantMutation<
    AssignActionData,
    AssignActionVariables
  >(ASSIGN_ACTION, {
    throwError: true,
  });

  const lockDevice = async (
    originalDevice: DeviceListItem,
    action: DeviceAction,
  ): Promise<boolean> => {
    const deviceId = originalDevice.id;
    if (pendingDevicesRef.current.has(deviceId)) return false;

    if (action.stateId !== 3) {
      setLockErrors((current) => ({
        ...current,
        [deviceId]: 'The selected action is not a lock action.',
      }));

      return false;
    }

    const previousOverride = overrides[deviceId];

    pendingDevicesRef.current.add(deviceId);

    setLockErrors((current) => ({
      ...current,
      [deviceId]: undefined,
    }));

    setOverrides((current) => ({
      ...current,
      [deviceId]: {
        state: { id: 3, name: 'LOCKED' },
        pending: true,
      },
    }));

    try {
      const response = await mutateData({
        deviceId,
        actionId: action.id,
      });

      if (response?.assignAction !== true) {
        throw new Error('The server did not confirm the lock.');
      }
    } catch (error: unknown) {
      setOverrides((current) => {
        const next = { ...current };

        if (previousOverride === undefined) {
          delete next[deviceId];
        } else {
          next[deviceId] = previousOverride;
        }

        return next;
      });

      setLockErrors((current) => ({
        ...current,
        [deviceId]: error instanceof Error ? error.message : String(error),
      }));

      return false;
    } finally {
      pendingDevicesRef.current.delete(deviceId);
    }

    updateDeviceLists(tenantId, originalDevice);

    setOverrides((current) => ({
      ...current,
      [deviceId]: {
        state: { id: 3, name: 'LOCKED' },
        pending: false,
      },
    }));

    invalidateQuery(`${tenantId}:device:${deviceId}:detail`);
    invalidateQuery(`${tenantId}:device:${deviceId}:history`);

    setRevisions((current) => ({
      ...current,
      [deviceId]: (current[deviceId] ?? 0) + 1,
    }));

    return true;
  };

  return {
    overrides,
    lockErrors,
    lockDevice,
    revisions,
  };
}
