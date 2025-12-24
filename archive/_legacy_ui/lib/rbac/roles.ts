export type Role = "USER" | "ADMIN" | "AUDITOR" | "INVESTOR";
export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  AUDITOR: "AUDITOR",
  INVESTOR: "INVESTOR",
} as const;

export const ORG_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "organizations:read"
  | "organizations:write"
  | "organizations:delete"
  | "assets:read"
  | "assets:write"
  | "assets:delete"
  | "assets:verify"
  | "verifications:read"
  | "verifications:write"
  | "audit:read"
  | "audit:export"
  | "api_keys:read"
  | "api_keys:write"
  | "api_keys:delete"
  | "webhooks:read"
  | "webhooks:write"
  | "webhooks:delete"
  | "admin:access"
  | "admin:settings";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: [
    "assets:read",
    "verifications:read",
    "api_keys:read",
    "webhooks:read",
  ],
  ADMIN: [
    "users:read",
    "users:write",
    "users:delete",
    "organizations:read",
    "organizations:write",
    "organizations:delete",
    "assets:read",
    "assets:write",
    "assets:delete",
    "assets:verify",
    "verifications:read",
    "verifications:write",
    "audit:read",
    "audit:export",
    "api_keys:read",
    "api_keys:write",
    "api_keys:delete",
    "webhooks:read",
    "webhooks:write",
    "webhooks:delete",
    "admin:access",
    "admin:settings",
  ],
  AUDITOR: [
    "users:read",
    "organizations:read",
    "assets:read",
    "verifications:read",
    "audit:read",
    "audit:export",
  ],
  INVESTOR: [
    "organizations:read",
    "assets:read",
    "verifications:read",
    "audit:read",
  ],
};

export const ORG_ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  OWNER: [
    "organizations:read",
    "organizations:write",
    "organizations:delete",
    "assets:read",
    "assets:write",
    "assets:delete",
    "assets:verify",
    "verifications:read",
    "verifications:write",
    "api_keys:read",
    "api_keys:write",
    "api_keys:delete",
    "webhooks:read",
    "webhooks:write",
    "webhooks:delete",
  ],
  ADMIN: [
    "organizations:read",
    "organizations:write",
    "assets:read",
    "assets:write",
    "assets:delete",
    "assets:verify",
    "verifications:read",
    "verifications:write",
    "api_keys:read",
    "api_keys:write",
    "webhooks:read",
    "webhooks:write",
  ],
  MEMBER: [
    "organizations:read",
    "assets:read",
    "assets:write",
    "verifications:read",
    "verifications:write",
  ],
  VIEWER: [
    "organizations:read",
    "assets:read",
    "verifications:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasOrgPermission(orgRole: OrgRole, permission: Permission): boolean {
  return ORG_ROLE_PERMISSIONS[orgRole]?.includes(permission) ?? false;
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getOrgRolePermissions(orgRole: OrgRole): Permission[] {
  return ORG_ROLE_PERMISSIONS[orgRole] ?? [];
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function canAccessAdmin(role: Role): boolean {
  return hasPermission(role, "admin:access");
}
