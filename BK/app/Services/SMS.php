<?php

namespace App\Services;

use Ipe\Sdk\Facades\SmsIr;
use App\Models\PhoneVerification;
use Carbon\Carbon;
use Illuminate\Support\Str;

class SMS
{
    public function send_code(string $phoneNumber): array
    {
        $otp = (string) random_int(1000, 9999);

        try {
            PhoneVerification::updateOrCreate(
                ['phone_number' => $phoneNumber],
                [
                    'otp' => $otp,
                    'expires_at' => Carbon::now()->addMinutes(5),
                    'is_verified' => false,
                    'attempts' => 0,
                ]
            );

            $this->sendOTP($phoneNumber, $otp);

            return [
                'success' => true,
                'message' => 'Verification code sent successfully',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to send verification code',
                'error' => config('app.debug') ? $e->getMessage() : null
            ];
        }
    }

    public function sendOTP(string $mobile, string $otp)
    {
        $templateId = config('services.smsir.template_id');
        $parameters = [
            [
                "name" => "Code",
                "value" => $otp
            ]
        ];

        return SmsIr::verifySend($mobile, $templateId, $parameters);
    }

    public function verifyOTP(string $phoneNumber, string $otp): array
    {
        $verification = PhoneVerification::where('phone_number', $phoneNumber)
            ->where('is_verified', false)
            ->first();

        if (!$verification) {
            return [
                'success' => false,
                'message' => 'No verification code found for this phone number.'
            ];
        }

        if (Carbon::now()->gt($verification->expires_at)) {
            return [
                'success' => false,
                'message' => 'Verification code has expired.'
            ];
        }

        if ($verification->attempts >= 5) {
            return [
                'success' => false,
                'message' => 'Too many failed attempts.'
            ];
        }

        if ($verification->otp === $otp) {
            $verificationToken = Str::random(64);
            $verification->update([
                'is_verified' => true,
                'verification_token' => $verificationToken,
            ]);

            return [
                'success' => true,
                'message' => 'Phone number verified successfully',
                'verification_token' => $verificationToken,
            ];
        }

        $verification->increment('attempts');

        return [
            'success' => false,
            'message' => 'Invalid verification code.'
        ];
    }

    public function resendOTP(string $phoneNumber): array
    {
        $verification = PhoneVerification::where('phone_number', $phoneNumber)
            ->where('is_verified', true)
            ->first();

        if ($verification) {
            return [
                'success' => false,
                'message' => 'Phone number already verified'
            ];
        }

        return $this->send_code($phoneNumber);
    }
}
