<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function register($data)
    {
        $user = User::create([
            'name' => $data['name'],
            'phone_number' => $data['phone_number'],
            'password' => Hash::make($data['password']),
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token
        ];
    }

    public function login($data)
    {
        $user = User::where('phone_number', $data['phone_number'])->first();

        if ($user && Hash::check($data['password'], $user->password)) {
            $token = $user->createToken('auth_token')->plainTextToken;
            $user->update(['last_login' => now()]);

            return [
                'message' => 'successfully logged in',
                'token' => $token,
                'name' => $user->name,
                'roles' => $user->getRoleNames(),
            ];
        }

        return [
            'message' => 'Invalid credentials',
        ];
    }

    public function delete($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return 'user deleted successfully';
    }

    public function list()
    {
        return User::with('roles')->get();
    }

    public function update($request, $id)
    {
        $user = User::findOrFail($id);
        $data = [
            'name' => $request['name'] ?? $user->name,
            'phone_number' => $request['phone_number'] ?? $user->phone_number,
        ];
        if (!empty($request['password'])) {
            $data['password'] = Hash::make($request['password']);
        }
        $user->update($data);
        return $user;
    }

    public function logout(User $user)
    {
        return $user->currentAccessToken()->delete();
    }
}
