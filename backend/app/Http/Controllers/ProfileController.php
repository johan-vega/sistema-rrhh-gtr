<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\WorkerResource;

class ProfileController extends ApiController
{
    public function show()
    {
        abort_unless(request()->user()->worker, 403);

        return $this->success(new WorkerResource(request()->user()->worker->load(['user', 'area', 'position'])));
    }

    public function update(UpdateProfileRequest $request)
    {
        $worker = request()->user()->worker;
        abort_unless($worker, 403);
        $worker->update($request->validated());

        return $this->success(new WorkerResource($worker->load(['user', 'area', 'position'])), 'Perfil actualizado correctamente');
    }
}
