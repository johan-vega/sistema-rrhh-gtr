<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateHrProfileRequest;
use App\Http\Resources\UserResource;

class HrProfileController extends ApiController
{
    public function show()
    {
        return $this->success(new UserResource(request()->user()->load('role')));
    }

    public function update(UpdateHrProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();
        $user->fill(['name' => $data['name'], 'email' => $data['email']]);

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->save();

        return $this->success(new UserResource($user->fresh()->load('role')), 'Perfil de RRHH actualizado correctamente');
    }
}
