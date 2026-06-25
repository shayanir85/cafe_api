<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function TokenCheck(Request $request){
        return response()->json([
            'user'=> $request->user()
        ]);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());
        return response()->json($result,200);
    }

    public function Update_Pass(Request $request)
    {
        // Validate the request inputs after password verification
        // This ensures we only validate if the user exists and current password is correct
        $request->validate([
            'password' => 'required|string',                    // Current password (already verified above)
            'newPassword' => 'required|string|min:8|confirmed', // New password with confirmation
            'newPassword_confirmation' => 'required|string'     // Confirmation field matching newPassword
        ]);
        // Get the authenticated user from the request
        $user = $request->user();
        
        // Check if user exists
        if (!$user) {
            return response()->json([
                'message' => 'user not found'
            ], 404);
        }
        
        // Verify that the provided current password matches the user's stored password
        // Note: Hash::check(plain_text, hashed_password)
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'current password is incorrect'
            ], 422);
        }
        //checks if password is confirmed or not 
        if($request->newPassword_confirmation === $request->newPassword){
            // Hash the new password and update the user record
            $user->password = Hash::make($request->newPassword);
            $user->save();
            return response()->json([
                'message' => 'password updated successfully'
            ], 200);
        }
        // Return success response
        return response()->json([
            'message' => 'password did not updated password is not confirmed'
        ]);
      
    }
    public function Register(RegisterRequest $request)
    {
        $result = $this->authService->register($request->validated());
        return response()->json($result,200);
    }

    public function delete($id){
        $result = $this->authService->delete($id);
        return response()->json([
            'message' => 'user successfully deleted',
            'result' => $result
        ]);
    }
    public function list(){
        $result = $this->authService->list();
        return response()->json($result);
    }
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
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
}
