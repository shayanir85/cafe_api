<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Ipe\Sdk\Facades\SmsIr;
use App\Models\PhoneVerification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SMS
{
    public function send_code(string $phoneNumber): array
    {
        $otp = (string) random_int(1000, 9999);
        try{

            $verification = PhoneVerification::updateOrCreate(
                ['phone_number' => $phoneNumber],
                [
                    'otp' => $otp,
                    'expires_at' => Carbon::now()->addMinutes(5),
                    'is_verified' => false,
                ]
            );

            $verification->increment('attempts');

            $this->sendOTP($phoneNumber, $otp);

            return [
                'success' => true,
                'message' => 'Verification code sent successfully',
            ];
        }catch(\Exception $e){
            return [
                'success' => false,
                'message' => 'Failed to send verification code',
                'error' => config('app.debug') ? $e->getMessage() : null
            ];
        }
    } 

    public function sendOTP(string $mobile, string $otp)
    {
        
        $templateId = 123456; // شناسه الگو
        $parameters = [
            [
                "name" => "Code",
                "value" => $otp
            ]
        ];

        $response = SmsIr::verifySend($mobile, $templateId, $parameters);
        return $response;
    }
    public function verifyOTP(string $phoneNumber, string $otp): bool
    {
        $verification = PhoneVerification::where('phone_number', $phoneNumber)
            ->where('is_verified', false)
            ->first();

        if (!$verification) {
            return false;
        }

        // Check if OTP expired
        if (Carbon::now()->gt($verification->expires_at)) {
            return false;
        }

        // Block after 5 failed attempts
        if ($verification->attempts >= 5) {
            return false;
        }

        // Verify OTP
        if ($verification->otp == $otp) {
            $verification->update(['is_verified' => true]);

            session(['verified_phone' => $phoneNumber]);

            return true;
        }

        $verification->increment('attempts');

        return false;
    }
    public function resendOTP(string $phoneNumber)
    {
        // Check if phone is already verified
        $verification = PhoneVerification::where('phone_number', $phoneNumber)
            ->where('is_verified', true)
            ->first();
            
        if ($verification) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number already verified'
            ], 400);
        }
        
        return $this->send_Code($phoneNumber);
    }
}
