// src/lib/auth.ts
import { auth } from "./auth-config";
import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 * For demo purposes, returns a demo user if no auth is set up
 */
export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (session?.user) {
      // Fetch user from our database to get role
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      
      if (dbUser) {
        return { ...session.user, id: dbUser.id, role: dbUser.role };
      }
      
      // Create user if doesn't exist in our DB
      const newUser = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || null,
          role: "VIEWER",
        },
      });
      
      return { ...session.user, id: newUser.id, role: newUser.role };
    }
    
    // Fallback for demo - remove in production
    if (process.env.NODE_ENV === "development") {
      const demoUser = await prisma.user.findFirst({
        where: { email: "demo@example.com" },
      });
      
      if (demoUser) {
        return { id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role };
      }
    }
    
    return null;
  } catch (error: unknown) {
    console.error("Error getting current user:", error);
    // Demo fallback
    if (process.env.NODE_ENV === "development") {
      try {
        const demoUser = await prisma.user.findFirst({
          where: { email: "demo@example.com" },
        });
        if (demoUser) {
          return { id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role };
        }
      } catch {
        // Ignore
      }
    }
    return null;
  }
}

/**
 * Check if user has required role
 */
export async function requireRole(requiredRole: "ADMIN" | "EDITOR" | "VIEWER") {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const roleHierarchy = { VIEWER: 1, EDITOR: 2, ADMIN: 3 } as const;
  const userRole = (user as { role?: keyof typeof roleHierarchy }).role ?? "VIEWER";

  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    throw new Error("Insufficient permissions");
  }

  return user;
}

