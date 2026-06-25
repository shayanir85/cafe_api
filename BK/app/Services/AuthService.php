<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;



class AuthService
{
    public function register($data)
    {
        $user =  User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone_number' => $data['phone_number'],
            'password' => Hash::make($data['password']),
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user ,
            'token' =>$token
        ];
    }

    public function delete($id){
        $user = User::findOrFail($id);
        $user->delete();
        return 'user deleted successfully';
    }

    public function list(){
        return User::all();
    }

    public function update($request, $id)
    {
        $user = User::findOrFail($id);
        $data = [
            'name' => $request['name'] ?? $user->name,
            'email' => $request['email'] ?? $user->email,
            'phone_number' => $request['phone_number'] ?? $user->phone_number,
        ];
        if (!empty($request['password'])) {
            $data['password'] = Hash::make($request['password']);
        }
        $user->update($data);
        return $user;
    }


    public function login($data)
    {
        $user = User::where('email', $data['email'])
            ->first();

        if ($user && Hash::check($data['password'], $user->password)) {
            $token = $user->createToken('auth_token')->plainTextToken;
            $user->update(['last_login' => now()]);

            return response()->json([
                'message' => 'successfully logged in',
                'token' => $token,
                'name'=>$user->name,
                'role'=>$user->role
            ], 200);
        }

        return response()->json([
            'message' => 'Invalid credentials',
        ], 401);
    }

    public function logout(User $user)
    {
        return $user->currentAccessToken()->delete();
    }
}
