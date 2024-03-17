import express from "express";

import authControllers from "../controllers/authControllers.js";
const {
    register,
    verifyEmail,
    resendVerifyEmail,
    login,
    logout,
    getCurrent,
    updateAvatar,
} = authControllers;

import {
    authenticate,
    isEmptyBody,
    validateBody,
    upload,
} from "../helpers/index.js";
import { userSignSchema, userEmailSchema } from "../schemas/userSchemas.js";

const authRouter = express.Router();

authRouter.post(
    "/register",
    isEmptyBody,
    validateBody(userSignSchema),
    register
);

authRouter.get("/verify/:verificationToken", verifyEmail);

authRouter.post("/verify", validateBody(userEmailSchema), resendVerifyEmail);

authRouter.post("/login", isEmptyBody, validateBody(userSignSchema), login);

authRouter.post("/logout", authenticate, logout);

authRouter.get("/current", authenticate, getCurrent);

authRouter.patch(
    "/avatars",
    authenticate,
    upload.single("avatar"),
    updateAvatar
);

export default authRouter;
