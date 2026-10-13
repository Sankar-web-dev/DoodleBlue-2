import { NextFunction, Request, Response } from "express";
import User, { IUser } from "./user.model";
import Role, { IRole, Resource, Action } from "../role/role.model";

// Extend res.locals so downstream code can rely on currentUser being the
// authenticated IUser and currentRole being the resolved role document (when
// the user has a custom role).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      currentUser?: IUser;
      currentRole?: IRole | null;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Please log in to continue",
        },
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      req.session.destroy(() => {});

      res.status(401).json({
        success: false,
        error: {
          code: "SESSION_INVALID",
          message: "Your session is invalid. Please log in again",
        },
      });
      return;
    }

    // Populate the role document for permission checks downstream.
    let currentRole: IRole | null = null;
    if (user.roleId) {
      currentRole = (await Role.findById(user.roleId).lean()) as unknown as IRole | null;
    }

    res.locals.currentUser = user;
    res.locals.currentRole = currentRole;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Permission-based authorization.
 *
 * SUPER_ADMIN bypasses all permission checks.
 * All other users must have the given resource/action in their role's permission
 * matrix.
 */
export function authorize(resource: Resource, action: Action) {
  return (
    _req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const user = res.locals.currentUser as IUser | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Please log in to continue",
        },
      });
      return;
    }

    // SUPER_ADMIN has implicit access to everything.
    if (user.role === "SUPER_ADMIN") {
      next();
      return;
    }

    const role = res.locals.currentRole as IRole | null;
    const perm = role?.permissions?.find((p) => p.resource === resource);

    if (perm && perm.actions.includes(action)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      },
    });
  };
}

/**
 * Guard for student self-service routes (/api/v1/me/*).
 * Passes if the authenticated user has a linked student profile (studentId).
 */
export function requireStudentAccount(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = res.locals.currentUser as IUser | undefined;

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Please log in to continue",
      },
    });
    return;
  }

  if (!user.studentId) {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "This endpoint is only available for student accounts",
      },
    });
    return;
  }

  next();
}

/**
 * Guards routes that require the user to have changed their temporary password.
 */
export function requirePasswordChanged(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = res.locals.currentUser as IUser | undefined;

  if (user?.mustChangePassword) {
    res.status(403).json({
      success: false,
      error: {
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "Change your password before accessing this resource",
      },
    });
    return;
  }

  next();
}
