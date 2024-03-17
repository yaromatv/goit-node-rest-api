import { Schema, model } from "mongoose";
import Joi from "joi";

import { handleSaveError, runValidatorsAndUpdate } from "./hooks.js";

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            match: emailRegex,
        },
        password: {
            type: String,
            minlength: 6,
            required: [true, "Set password for user"],
        },
        subscription: {
            type: String,
            enum: ["starter", "pro", "business"],
            default: "starter",
        },
        token: String,
        avatarURL: {
            type: String,
            required: true,
        },
        verify: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
            required: [true, "Verify token is required"],
        },
    },
    { versionKey: false, timestamps: true }
);

userSchema.post("save", handleSaveError);

userSchema.pre("findOneAndUpdate", runValidatorsAndUpdate);
userSchema.post("findOneAndUpdate", handleSaveError);

export const userSignSchema = Joi.object({
    email: Joi.string().pattern(emailRegex).required().messages({
        "any.required": `missing required email field`,
    }),
    password: Joi.string().min(6).required().messages({
        "any.required": `missing required password field`,
    }),
});

export const userEmailSchema = Joi.object({
    email: Joi.string().pattern(emailRegex).required().messages({
        "any.required": `missing required email field`,
    }),
});

const User = model("user", userSchema);

export default User;
