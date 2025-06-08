import { useWorkspaceStore } from "../store/workspaceStore";

export enum ResourceType {
  WORKSPACE = "workspace",
  PROJECT = "project",
  TICKET = "ticket",
  USER = "user",
  COMMENT = "comment",
  ATTACHMENT = "attachment",
  REPORT = "report",
}

export enum ActionType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
}

const PERMISSION_MATRIX: Record<string, Record<ResourceType, ActionType[]>> = {
  SUPER_ADMIN: {
    [ResourceType.WORKSPACE]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
      ActionType.MANAGE,
    ],
    [ResourceType.PROJECT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
      ActionType.MANAGE,
    ],
    [ResourceType.TICKET]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
      ActionType.MANAGE,
    ],
    [ResourceType.USER]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
      ActionType.MANAGE,
    ],
    [ResourceType.COMMENT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
    ],
    [ResourceType.ATTACHMENT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
    ],
    [ResourceType.REPORT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
    ],
  },
  ADMIN: {
    [ResourceType.WORKSPACE]: [ActionType.READ, ActionType.UPDATE],
    [ResourceType.PROJECT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
      ActionType.MANAGE,
    ],
    [ResourceType.TICKET]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
      ActionType.MANAGE,
    ],
    [ResourceType.USER]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
    ],
    [ResourceType.COMMENT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
    ],
    [ResourceType.ATTACHMENT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
    ],
    [ResourceType.REPORT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
    ],
  },
  MEMBER: {
    [ResourceType.WORKSPACE]: [ActionType.READ],
    [ResourceType.PROJECT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
    ],
    [ResourceType.TICKET]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
    ],
    [ResourceType.USER]: [ActionType.READ],
    [ResourceType.COMMENT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
    ],
    [ResourceType.ATTACHMENT]: [
      ActionType.CREATE,
      ActionType.READ,
      ActionType.UPDATE,
      ActionType.DELETE,
    ],
    [ResourceType.REPORT]: [ActionType.READ],
  },
  CLIENT: {
    [ResourceType.WORKSPACE]: [ActionType.READ],
    [ResourceType.PROJECT]: [ActionType.READ],
    [ResourceType.TICKET]: [ActionType.CREATE, ActionType.READ],
    [ResourceType.USER]: [ActionType.READ],
    [ResourceType.COMMENT]: [ActionType.CREATE, ActionType.READ],
    [ResourceType.ATTACHMENT]: [ActionType.CREATE, ActionType.READ],
    [ResourceType.REPORT]: [ActionType.READ],
  },
  VIEWER: {
    [ResourceType.WORKSPACE]: [ActionType.READ],
    [ResourceType.PROJECT]: [ActionType.READ],
    [ResourceType.TICKET]: [ActionType.READ],
    [ResourceType.USER]: [ActionType.READ],
    [ResourceType.COMMENT]: [ActionType.READ],
    [ResourceType.ATTACHMENT]: [ActionType.READ],
    [ResourceType.REPORT]: [ActionType.READ],
  },
};

export const usePermissions = () => {
  const { currentWorkspace } = useWorkspaceStore();

  const hasPermission = (
    resource: ResourceType,
    action: ActionType,
    isOwner: boolean = false
  ): boolean => {
    const role = currentWorkspace?.role?.toUpperCase() || "VIEWER";

    if (role === "SUPER_ADMIN") {
      return true;
    }

    const rolePermissions = PERMISSION_MATRIX[role] || {};
    const allowedActions = rolePermissions[resource] || [];

    if (
      allowedActions.includes(action) ||
      allowedActions.includes(ActionType.MANAGE)
    ) {
      return true;
    }

    if (
      isOwner &&
      (action === ActionType.UPDATE || action === ActionType.DELETE)
    ) {
      if (
        resource === ResourceType.TICKET ||
        resource === ResourceType.COMMENT ||
        resource === ResourceType.ATTACHMENT
      ) {
        return true;
      }
    }

    return false;
  };

  return { hasPermission };
};
