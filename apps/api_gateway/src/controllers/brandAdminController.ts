import type { RequestHandler } from "express";
import { brandAdminService } from "../services/brandAdminService.js";
import { userDomainService } from "../services/userDomainService.js";

async function requireRole(authorization: string | undefined, roles: string[]) {
  const user = await userDomainService.fetchMe(authorization);
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden.");
  }
  return user;
}

export const getMyBrand: RequestHandler = async (req, res, next) => {
  try {
    const user = await requireRole(req.headers.authorization, ["BRAND_ADMIN"]);
    if (!user.brandId) return res.status(404).json({ success: false, message: "No brand linked." });
    const brand = await brandAdminService.getBrand(user.brandId);
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

export const getMyDeals: RequestHandler = async (req, res, next) => {
  try {
    const user = await requireRole(req.headers.authorization, ["BRAND_ADMIN"]);
    if (!user.brandId) return res.status(404).json({ success: false, message: "No brand linked." });
    const deals = await brandAdminService.listDeals(user.brandId);
    res.status(200).json({ success: true, data: deals });
  } catch (error) {
    next(error);
  }
};

export const createMyDeal: RequestHandler = async (req, res, next) => {
  try {
    const user = await requireRole(req.headers.authorization, ["BRAND_ADMIN"]);
    if (!user.brandId) return res.status(404).json({ success: false, message: "No brand linked." });
    const deal = await brandAdminService.createDeal(user.brandId, { ...req.body, createdBy: user.clerkUserId });
    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

export const deleteMyDeal: RequestHandler = async (req, res, next) => {
  try {
    const user = await requireRole(req.headers.authorization, ["BRAND_ADMIN"]);
    if (!user.brandId) return res.status(404).json({ success: false, message: "No brand linked." });
    const deal = await brandAdminService.deleteDeal(user.brandId, String(req.params.dealId));
    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

export const listPendingBrands: RequestHandler = async (req, res, next) => {
  try {
    await requireRole(req.headers.authorization, ["APP_ADMIN"]);
    const brands = await brandAdminService.listPendingBrands();
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

export const approveBrand: RequestHandler = async (req, res, next) => {
  try {
    await requireRole(req.headers.authorization, ["APP_ADMIN"]);
    const brand = await brandAdminService.approveBrand(String(req.params.brandId));
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

export const rejectBrand: RequestHandler = async (req, res, next) => {
  try {
    await requireRole(req.headers.authorization, ["APP_ADMIN"]);
    const brand = await brandAdminService.rejectBrand(String(req.params.brandId), req.body?.reason);
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};
