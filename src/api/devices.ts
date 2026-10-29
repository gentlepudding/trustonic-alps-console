export const LIST_DEVICES = `
  query ListDevices(
    $tenantId: String
    $page: Int
    $pageSize: Int
    $imei: String
    $serialNumber: String
    $stateId: Int
  ) {
    listDevices(
      tenantId: $tenantId
      page: $page
      pageSize: $pageSize
      imei: $imei
        serialNumber: $serialNumber
        stateId: $stateId
    ) {
      pageInfo {
        total_count
      }
      deviceList {
        id
        serialNumber
        IMEIs {
            imei
            isPrimary
        }
        modelMarketingName
        state {
            id
            name
        }
        lastCheckin
      }
    }
  }
`;

export type DeviceListItem = {
  id: string;
  serialNumber: string | null;
  IMEIs: Array<{
    imei: string | null;
    isPrimary: boolean | null;
  } | null> | null;
  modelMarketingName: string | null;
  state: {
    id: number;
    name: string | null;
  } | null;
  lastCheckin: string | null;
};

export type ListDevicesData = {
  listDevices: {
    pageInfo: {
      total_count: number | null;
    } | null;
    deviceList: Array<DeviceListItem | null> | null;
  } | null;
};

export type ListDevicesVariables = {
  page: number;
  pageSize: number;
  imei?: string;
  serialNumber?: string;
  stateId?: number;
};
