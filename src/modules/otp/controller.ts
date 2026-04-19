import { Request, Response } from "express";
import axios from "axios";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { AppError } from "../../core/errors/AppError.js";
import { generateOTP } from "../../core/utils/generateOTP.js";

const otpStore = new Map<string, { otp: string; expiresAt: number }>();
const verifiedPhones = new Map<string, number>();
const VERIFIED_PHONE_TTL_MS = 10 * 60 * 1000;

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

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

    try {
        await axios.post(
            "https://restapi.easysendsms.app/v1/rest/sms/send",
            {
                from: process.env.SENDER_NAME,
                to: phone,
                text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
                type: "0",
            },
            {
                headers: {
                    apikey: process.env.EASYSENDSMS_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        );

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
