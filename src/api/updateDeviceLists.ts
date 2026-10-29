import type { TenantId } from '../tenant/TenantContext';

import type {
  DeviceListItem,
  ListDevicesData,
  ListDevicesVariables,
} from './devices';
import { updateCachedQueries } from './queryCache';

function matchesDevice(
  device: DeviceListItem,
  variables: ListDevicesVariables,
): boolean {
  if (
    variables.stateId !== undefined &&
    device.state?.id !== variables.stateId
  ) {
    return false;
  }

  if (
    variables.serialNumber &&
    !device.serialNumber
      ?.toLowerCase()
      .includes(variables.serialNumber.toLowerCase())
  ) {
    return false;
  }

  const imei = variables.imei;

  if (
    imei &&
    !device.IMEIs?.some((item) => item?.imei?.includes(imei) === true)
  ) {
    return false;
  }

  return true;
}

export function updateDeviceLists(
  tenantId: TenantId,
  originalDevice: DeviceListItem,
) {
  const updatedDevice: DeviceListItem = {
    ...originalDevice,
    state: { id: 3, name: 'LOCKED' },
  };

  updateCachedQueries<ListDevicesData, ListDevicesVariables>(
    `${tenantId}:devices`,
    (data, variables) => {
      const list = data.listDevices;

      if (list === null) return data;

      const matchedBefore = matchesDevice(originalDevice, variables);
      const matchesAfter = matchesDevice(updatedDevice, variables);

      if (!matchedBefore && matchesAfter) {
        return undefined;
      }

      if (!matchedBefore) return data;

      if (!matchesAfter) {
        const totalCount = list.pageInfo?.total_count;

        return {
          ...data,
          listDevices: {
            ...list,
            deviceList:
              list.deviceList?.filter(
                (device) => device?.id !== originalDevice.id,
              ) ?? null,
            pageInfo:
              list.pageInfo === null
                ? null
                : {
                    ...list.pageInfo,
                    total_count:
                      totalCount == null ? null : Math.max(0, totalCount - 1),
                  },
          },
        };
      }

      return {
        ...data,
        listDevices: {
          ...list,
          deviceList:
            list.deviceList?.map((device) =>
              device?.id === originalDevice.id
                ? { ...device, state: updatedDevice.state }
                : device,
            ) ?? null,
        },
      };
    },
  );
}
