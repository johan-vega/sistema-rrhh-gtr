<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends ApiController
{
    public function login(LoginRequest $request)
    {
        $user = User::with(['role', 'worker.area', 'worker.position'])->where('email', $request->validated('email'))->first();
        if (! $user || ! Hash::check($request->validated('password'), $user->password) || ($user->worker && ! $user->worker->active)) {
            return response()->json(['success' => false, 'message' => 'Credenciales inválidas o usuario inactivo'], 401);
        } $token = $user->createToken($request->validated('device_name', 'angular-pwa'))->plainTextToken;

        return $this->success(['token' => $token, 'user' => new UserResource($user)], 'Inicio de sesión correcto');
    }

    public function logout()
    {
        request()->user()->currentAccessToken()?->delete();

        return $this->success(null, 'Sesión cerrada correctamente');
    }

    public function me()
    {
        return $this->success(new UserResource(request()->user()->load(['role', 'worker.area', 'worker.position'])));
    }
}
