/** Role-based access control (RBAC) for the AI Platform. */

// ─── Types ─────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'user' | 'readonly'

export type Permission =
  | 'chat:use'
  | 'canvas:use'
  | 'tutor:use'
  | 'os:use'
  | 'agents:use'
  | 'explain:use'
  | 'collab:use'
  | 'learn:use'
  | 'plugins:manage'
  | 'monitoring:view'
  | 'api-docs:view'

// ─── Permission matrix ─────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'chat:use',
    'canvas:use',
    'tutor:use',
    'os:use',
    'agents:use',
    'explain:use',
    'collab:use',
    'learn:use',
    'plugins:manage',
    'monitoring:view',
    'api-docs:view',
  ],
  user: [
    'chat:use',
    'canvas:use',
    'tutor:use',
    'os:use',
    'agents:use',
    'explain:use',
    'collab:use',
    'learn:use',
    'api-docs:view',
  ],
  readonly: [
    'chat:use',
    'api-docs:view',
  ],
}

// ─── Role ordering (lowest → highest privilege) ────────────────────────────

const ROLE_RANK: Record<Role, number> = { readonly: 0, user: 1, admin: 2 }

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Derive a role from the authenticated user's email.
 * In a real app this would come from a database / identity provider.
 * For this demo:
 *   • email containing "admin"      → admin
 *   • any other valid email         → user
 */
export function getRoleFromEmail(email: string): Role {
  const lower = email.toLowerCase().trim()
  if (lower.includes('admin') || lower.startsWith('owner@') || lower.startsWith('root@')) {
    return 'admin'
  }
  return 'user'
}

/** Check whether `role` has the given permission. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/** Check whether `userRole` is at least as privileged as `requiredRole`. */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole]
}

/** Return a human-readable label for a role. */
export function roleLabel(role: Role): string {
  return { admin: 'Admin', user: 'User', readonly: 'Read-only' }[role]
}

/** Badge colour class for a role (Tailwind). */
export function roleBadgeClass(role: Role): string {
  return {
    admin: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    user: 'bg-primary/15 text-primary border-primary/30',
    readonly: 'bg-secondary text-secondary-foreground border-border',
  }[role]
}
