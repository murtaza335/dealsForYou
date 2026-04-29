import type { RequestHandler } from "express";
import { userDomainService } from "../services/userDomainService.js";

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const data = await userDomainService.fetchMe(req.headers.authorization);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const onboardConsumer: RequestHandler = async (req, res, next) => {
  try {
    const payload = await userDomainService.onboardConsumer(req.body);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

export const onboardBrandAdmin: RequestHandler = async (req, res, next) => {
  try {
    const payload = await userDomainService.onboardBrandAdmin(req.body);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};
