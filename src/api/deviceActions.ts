export const LIST_AVAILABLE_ACTIONS = `
  query ListAvailableActions(
    $tenantId: String
    $stateId: String
  ) {
    listAvailableActions(
      tenantId: $tenantId
      stateId: $stateId
    ) {
      id
      actionName
      policyName
      stateId
    }
  }
`;

export const ASSIGN_ACTION = `
  mutation AssignAction(
    $tenantId: String!
    $deviceId: String!
    $actionId: String!
  ) {
    assignAction(
      tenantId: $tenantId
      deviceId: $deviceId
      actionId: $actionId
    )
  }
`;

export type DeviceAction = {
  id: string;
  actionName: string | null;
  policyName: string | null;
  stateId: number | null;
};

export type AvailableActionsData = {
  listAvailableActions: Array<DeviceAction | null> | null;
};

export type AvailableActionsVariables = {
  stateId: string;
};

export type AssignActionData = {
  assignAction: boolean | null;
};

export type AssignActionVariables = {
  deviceId: string;
  actionId: string;
};
