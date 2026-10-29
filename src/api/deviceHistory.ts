export const LIST_DEVICE_HISTORY = `
  query ListDeviceHistory(
    $tenantId: String!
    $deviceId: String!
    $page: Int
    $pageSize: Int
  ) {
    listDeviceHistory(
      tenantId: $tenantId
      deviceId: $deviceId
      page: $page
      pageSize: $pageSize
    ) {
      pageInfo {
        total_count
      }
      histories {
        type
        createdAt
        email
        policyName
        nextPolicyName
        actionName
      }
    }
  }
`;

export type DeviceHistoryItem = {
  type: string | null;
  createdAt: string | null;
  email: string | null;
  policyName: string | null;
  nextPolicyName: string | null;
  actionName: string | null;
};

export type DeviceHistoryData = {
  listDeviceHistory: {
    pageInfo: {
      total_count: number | null;
    } | null;
    histories: Array<DeviceHistoryItem | null> | null;
  } | null;
};

export type DeviceHistoryVariables = {
  deviceId: string;
  page: number;
  pageSize: number;
};
