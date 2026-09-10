<?php

namespace App\Policies;

use App\Models\LaborRequest;
use App\Models\User;

class LaborRequestPolicy
{
    public function view(User $user, LaborRequest $request): bool
    {
        return $user->isHr() || $request->worker_id === $user->worker?->id;
    }

    public function cancel(User $user, LaborRequest $request): bool
    {
        return $user->isHr() || $request->worker_id === $user->worker?->id;
    }

    public function downloadDocument(User $user, LaborRequest $request): bool
    {
        return $this->view($user, $request);
    }
}
