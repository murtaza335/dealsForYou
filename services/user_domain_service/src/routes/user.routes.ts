import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { USER_ROLES } from "../types/role.type.js";
import {
  getMe,
  listUsers,
  onboardBrandAdmin,
  onboardConsumer,
  updateMe,
  upsertFromClerk,
} from "../controllers/user.controller.js";

export const userRouter = Router();

// The API gateway forwards the Clerk user id in the user-id header for these routes.
userRouter.get("/me", getMe);
userRouter.patch("/me", updateMe);
userRouter.post("/upsert-from-clerk", upsertFromClerk);
userRouter.post("/onboard/consumer", onboardConsumer);
userRouter.post("/onboard/brand-admin", onboardBrandAdmin);

userRouter.get(
  "/admin/users",
  requireAuth,
  requireRole(USER_ROLES.APP_ADMIN),
  listUsers,
);
