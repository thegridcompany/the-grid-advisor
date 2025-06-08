import React from 'react';
import { usePermissions, ResourceType, ActionType } from '../../hooks/usePermissions';

type PermissionGateProps = {
  resource: ResourceType;
  action: ActionType;
  isOwner?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  action,
  isOwner = false,
  children,
  fallback = null,
}) => {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(resource, action, isOwner)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}; 