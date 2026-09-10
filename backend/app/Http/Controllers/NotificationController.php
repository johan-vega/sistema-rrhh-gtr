<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    public function index(Request $request)
    {
        return $this->success($request->user()->notifications()->latest()->paginate(20));
    }

    public function read(Request $request, string $notification)
    {
        $item = $request->user()->notifications()->findOrFail($notification);
        $item->markAsRead();

        return $this->success(null, 'Notificación marcada como leída');
    }

    public function readAll(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->success(null, 'Notificaciones marcadas como leídas');
    }
}
