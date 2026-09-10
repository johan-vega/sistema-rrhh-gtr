<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LaborRequestNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $event, private readonly int $requestId, private readonly string $message) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['event' => $this->event, 'request_id' => $this->requestId, 'message' => $this->message];
    }
}
