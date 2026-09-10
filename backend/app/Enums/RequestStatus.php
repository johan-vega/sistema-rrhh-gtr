<?php

namespace App\Enums;

enum RequestStatus: string
{
    case PENDING = 'PENDIENTE';
    case APPROVED = 'APROBADA';
    case REJECTED = 'RECHAZADA';
    case CANCELLED = 'CANCELADA';
}
