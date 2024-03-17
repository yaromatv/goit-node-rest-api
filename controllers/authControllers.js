import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import path from "path";
import fs from "fs/promises";
import Jimp from "jimp";
import { nanoid } from "nanoid";
import { __dirname } from "../helpers/upload.js";

import User from "../schemas/userSchemas.js";

import HttpError from "../helpers/index.js";
import { ctrlWrapper, sendEmail } from "../helpers/index.js";

const { JWT_SECRET, BASE_URL } = process.env;

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
    const { email, password } = req.body;
    const existUser = await User.findOne({ email });

    if (existUser) {
        throw HttpError(409, `${email} is already in use`);
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const verificationToken = nanoid();

    const newUser = await User.create({
        ...req.body,
        password: hashPassword,
        avatarURL,
        verificationToken,
    });

    const verificationEmail = {
        to: email,
        subject: "Verify your email",
        content: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click to verify your email</a>`,
    };

    sendEmail(verificationEmail);

    res.status(201).json({
        user: {
            email: newUser.email,
            subscription: newUser.subscription,
        },
    });
};

const verifyEmail = async (req, res) => {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
        throw HttpError(404, `User not found`);
    }
    await User.findByIdAndUpdate(user._id, {
        verify: true,
        verificationToken: null,
    });

    res.json({ message: "Verification successful" });
};

const resendVerifyEmail = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        throw HttpError(404, `User not found`);
    }
    if (user.verify) {
        throw HttpError(400, "Verification has already been passed");
    }

    const verificationEmail = {
        to: email,
        subject: "Verify your email",
        content: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">Click to verify your email</a>`,
    };

    sendEmail(verificationEmail);

    res.json({ message: "Verification email sent" });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const existUser = await User.findOne({ email });
    if (!existUser) {
        throw HttpError(401, `Wrong email or password`);
    }

    if (!existUser.verify) {
        throw HttpError(401, `Email is not verified`);
    }

    const passwordCompare = await bcrypt.compare(password, existUser.password);
    if (!passwordCompare) {
        throw HttpError(401, `Wrong email or password`);
    }

    const payload = { id: existUser._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
    await User.findByIdAndUpdate(existUser._id, { token });

    res.status(201).json({
        token,
        user: {
            email: existUser.email,
            subscription: existUser.subscription,
        },
    });
};

const logout = async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { token: "" });
    res.status(204).json();
};

const getCurrent = async (req, res) => {
    const { email, subscription } = req.user;
    res.json({ email, subscription });
};

const updateAvatar = async (req, res) => {
    const { _id } = req.user;
    const { path: tempUpload, originalname } = req.file;
    const filename = `${_id}_${originalname}`;
    const resultUpload = path.join(avatarsDir, filename);

    const image = await Jimp.read(tempUpload);
    await image.resize(Jimp.AUTO, 250).writeAsync(tempUpload);

    await fs.rename(tempUpload, resultUpload);

    const avatarURL = path.join("avatars", filename);
    await User.findByIdAndUpdate(_id, { avatarURL });

    res.json({ avatarURL });
};

export default {
    register: ctrlWrapper(register),
    verifyEmail: ctrlWrapper(verifyEmail),
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
    login: ctrlWrapper(login),
    logout: ctrlWrapper(logout),
    getCurrent: ctrlWrapper(getCurrent),
    updateAvatar: ctrlWrapper(updateAvatar),
};
