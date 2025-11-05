// Role-based permissions helper

type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

export const permissions = {
  // Messages
  canSendMessage: (role: Role) => role === 'ADMIN' || role === 'EDITOR',
  canViewMessages: (role: Role) => true, // All roles can view
  canScheduleMessage: (role: Role) => role === 'ADMIN' || role === 'EDITOR',
  canCancelSchedule: (role: Role) => role === 'ADMIN' || role === 'EDITOR',
  
  // Notes
  canCreateNote: (role: Role) => role === 'ADMIN' || role === 'EDITOR',
  canViewNotes: (role: Role) => true,
  canDeleteNote: (role: Role) => role === 'ADMIN',
  
  // Contacts
  canCreateContact: (role: Role) => role === 'ADMIN' || role === 'EDITOR',
  canViewContacts: (role: Role) => true,
  canEditContact: (role: Role) => role === 'ADMIN' || role === 'EDITOR',
  canDeleteContact: (role: Role) => role === 'ADMIN',
  
  // Users/Team
  canManageUsers: (role: Role) => role === 'ADMIN',
  canViewTeam: (role: Role) => true,
  
  // Analytics
  canViewAnalytics: (role: Role) => true,
};

export function hasPermission(role: Role, permission: keyof typeof permissions): boolean {
  return permissions[permission](role);
}
