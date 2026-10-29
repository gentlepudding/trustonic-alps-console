export const DEVICE_DETAIL = `
  query DeviceDetail($tenantId: String!, $deviceId: String!) {
    deviceDetail(tenantId: $tenantId, deviceId: $deviceId) {
      id
      serialNumber
      deviceBrandName
      deviceModelMarketingName
      imsi
      state {
        id
        name
      }
      policy {
        id
        name
        color
      }
    }
  }
`;

export type DeviceDetailData = {
  deviceDetail: {
    id: string;
    serialNumber: string | null;
    deviceBrandName: string | null;
    deviceModelMarketingName: string | null;
    imsi: string | null;
    state: {
      id: number;
      name: string | null;
    } | null;
    policy: {
      id: string;
      name: string | null;
      color: string | null;
    } | null;
  } | null;
};

export type DeviceDetailVariables = {
  deviceId: string;
};
