import { Request, Response } from "express";
import axios from "axios";
import { Vonage } from "@vonage/server-sdk";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { AppError } from "../../core/errors/AppError.js";
import { generateOTP } from "../../core/utils/generateOTP.js";

const otpStore = new Map<string, { otp: string; expiresAt: number }>();
const verifiedPhones = new Map<string, number>();
const VERIFIED_PHONE_TTL_MS = 10 * 60 * 1000;

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY!,
    apiSecret: process.env.VONAGE_API_SECRET!,
});

export const checkPhoneVerified = (phone: string): boolean => {
    const expiresAt = verifiedPhones.get(phone);
    if (!expiresAt) {
        return false;
    }

    if (Date.now() > expiresAt) {
        verifiedPhones.delete(phone);
        return false;
    }

    return true;
};

export const consumeVerifiedPhone = (phone: string): void => {
    verifiedPhones.delete(phone);
};

export const send = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) throw AppError.badRequest("Phone number is required");
    const normalizedPhone = phone.startsWith("0")
        ? `+213${phone.slice(1)}`
        : phone;

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

    try {
        await vonage.sms.send({
            to: normalizedPhone,
            from: "Wasselni",
            text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
        });

        otpStore.set(phone, { otp, expiresAt });

        return res
            .status(200)
            .json({ success: true, message: "OTP sent successfully" });
    } catch (error: any) {
        console.error(
            "EasySendSMS Error:",
            error.response?.data || error.message,
        );
        throw AppError.internal("Failed to send OTP");
    }
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) throw AppError.badRequest("Phone and OTP are required");

    const record = otpStore.get(phone);
    if (!record) throw AppError.badRequest("No OTP found for this number");

    if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        throw AppError.badRequest("OTP has expired");
    }

    if (record.otp !== otp) throw AppError.badRequest("Invalid OTP");

    otpStore.delete(phone);
    const verifiedUntil = Date.now() + VERIFIED_PHONE_TTL_MS;
    verifiedPhones.set(phone, verifiedUntil);

    setTimeout(() => {
        const expiresAt = verifiedPhones.get(phone);
        if (expiresAt && expiresAt <= Date.now()) {
            verifiedPhones.delete(phone);
        }
    }, VERIFIED_PHONE_TTL_MS);

    return res
        .status(200)
        .json({ success: true, message: "Phone number verified!" });
});
