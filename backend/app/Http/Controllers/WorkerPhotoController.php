<?php
namespace App\Http\Controllers;

use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WorkerPhotoController extends Controller
{
    public function show(Request $request, Worker $worker)
    {
        abort_unless($request->user()->isHr() || $request->user()->worker?->id === $worker->id, 403);
        abort_unless($worker->photo_path, 404);
        $disk = Storage::disk(config('filesystems.default'));
        abort_unless($disk->exists($worker->photo_path), 404);
        return $disk->response($worker->photo_path, 'foto', [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
