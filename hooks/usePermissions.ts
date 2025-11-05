"use client";

import { useQuery } from "@tanstack/react-query";
import { permissions } from "@/lib/permissions";

type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
}

export function usePermissions() {
  const { data: user } = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: () => fetch("/api/auth/get-session").then((r) => r.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const role = user?.user.role || 'VIEWER';

  return {
    user,
    role,
    canSendMessage: permissions.canSendMessage(role),
    canViewMessages: permissions.canViewMessages(role),
    canScheduleMessage: permissions.canScheduleMessage(role),
    canCancelSchedule: permissions.canCancelSchedule(role),
    canCreateNote: permissions.canCreateNote(role),
    canViewNotes: permissions.canViewNotes(role),
    canDeleteNote: permissions.canDeleteNote(role),
    canCreateContact: permissions.canCreateContact(role),
    canViewContacts: permissions.canViewContacts(role),
    canEditContact: permissions.canEditContact(role),
    canDeleteContact: permissions.canDeleteContact(role),
    canManageUsers: permissions.canManageUsers(role),
    canViewTeam: permissions.canViewTeam(role),
    canViewAnalytics: permissions.canViewAnalytics(role),
  };
}
