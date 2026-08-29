<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use App\Http\Requests\RegisterRequest;
use App\Models\PhoneVerification;
use App\Models\User;
use App\Services\SMS;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
    protected $authService;
    protected $smsService;
    /**
     * Constructor with dependency injection
     */
    public function __construct(AuthService $authService, SMS $smsService)
    {
        $this->authService = $authService;
        $this->smsService = $smsService;
    }

    public function TokenCheck(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }


    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());

        if (!isset($result['token'])) {
            return response()->json($result, 401);
        }

        return response()->json($result, 200);
    }

    public function Update_Pass(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
            'newPassword' => 'required|string|min:8|confirmed',
            'newPassword_confirmation' => 'required|string'
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'user not found'
            ], 404);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'current password is incorrect'
            ], 422);
        }

        if ($request->newPassword_confirmation === $request->newPassword) {
            $user->password = Hash::make($request->newPassword);
            $user->save();

            return response()->json([
                'message' => 'password updated successfully'
            ], 200);
        }

        return response()->json([
            'message' => 'password did not updated password is not confirmed'
        ]);
    }

    public function Register(RegisterRequest $request)
    {
    // Check if phone is verified (session set by verifyOTP OR verification_token)
     $verified = session()->has('verified_phone');

     if (!$verified && $request->has('verification_token')) {
         $verified = PhoneVerification::where('phone_number', $request->phone_number)
             ->where('verification_token', $request->verification_token)
             ->where('is_verified', true)
             ->exists();
     }

     if (!$verified) {
         return response()->json([
             'success' => false,
             'message' => 'Phone number not verified. Please verify your phone first.'
        ], 403);
     }

    // Phone is verified, proceed with registration
        $result = $this->authService->register($request->validated());

        if (isset($result['token'])) {
            session()->forget('verified_phone');
        }

        return response()->json($result, $result ? 201 : 400);
    }

    public function delete($id)
    {
        $result = $this->authService->delete($id);
        return response()->json([
            'message' => 'user successfully deleted',
            'result' => $result
        ]);
    }

    public function list()
    {
        $result = $this->authService->list();
        return response()->json($result);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone_number' => 'sometimes|max:11',
            'password' => 'sometimes|string|min:8',
        ]);
        $result = $this->authService->update($validated, $id);
        return response()->json($result);
    }

    public function logout(Request $request)    
    {
        $result = $this->authService->logout($request->user());
        return response()->json([
            'message' => 'Successfully logged out',
            'result' => $result
        ], 200);
    }
    /**
     * Send OTP for registration
     */
    public function sendOTP(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string|regex:/^[0-9]{10,11}$/',
        ]);
        // Option 1: Use AuthService which has SMS injected
        $result = $this->smsService->send_Code($request->phone_number);
        
        // Option 2: Use SMS service directly (if you need to bypass AuthService)
        // $result = $this->smsService->sendCode($request->phone_number);
        
        return response()->json($result, $result ? 200 : 400);
    }

    /**
     * Verify OTP
     */
    public function verifyOTP(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string|regex:/^[0-9]{10,11}$/',
            'otp' => 'required|string|size:4|regex:/^[0-9]+$/'
        ]);

        $result = $this->smsService->verifyOTP(
            $request->phone_number,
            $request->otp
        );
        if ($result['success']) {
            session()->put('verified_phone', $request->phone_number);

            $user = User::where('phone_number', $request->phone_number)->first();
            if ($user) {
                $user->update(['phone_number_verified_at' => Carbon::now()]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Phone number verified successfully',
                'verification_token' => $result['verification_token'] ?? null,
                'user_exists' => $user ? true : false,
            ], 200);
        }

        return response()->json($result, 400);
    }

    /**
     * Resend OTP
     */
    public function resendOTP(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string|regex:/^[0-9]{10,11}$/'
        ]);
        $result = $this->smsService->resendOTP($request->phone_number);
        
        return response()->json($result, $result ? 200 : 400);
    }

    /**
     * OTP Login for existing users
     */
    public function otpLogin(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string|regex:/^[0-9]{10,11}$/',
            'otp' => 'required|string|size:4|regex:/^[0-9]+$/',
        ]);

        $result = $this->smsService->verifyOTP(
            $request->phone_number,
            $request->otp
        );

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        $user = User::where('phone_number', $request->phone_number)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'کاربری با این شماره یافت نشد. لطفاً ابتدا ثبت‌نام کنید.',
                'user_exists' => false,
            ], 404);
        }

        $user->update(['phone_number_verified_at' => Carbon::now()]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $roles = $user->getRoleNames();

        return response()->json([
            'success' => true,
            'token' => $token,
            'name' => $user->name,
            'id' => $user->id,
            'phone_number' => $user->phone_number,
            'roles' => $roles,
            'role' => $roles->first() ?? 'user',
        ], 200);
    }

    /**
     * Assign roles to a user (partial update via PATCH)
     */
    public function assignRoles(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot modify your own roles'
            ], 403);
        }

        $validated = $request->validate([
            'roles' => 'sometimes|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        $user->load('roles');

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Roles updated successfully'
        ]);
    }
}
