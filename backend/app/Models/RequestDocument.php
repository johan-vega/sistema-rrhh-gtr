<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestDocument extends Model
{
    protected $fillable = ['labor_request_id', 'original_name', 'stored_name', 'path', 'mime_type', 'size'];

    public function request()
    {
        return $this->belongsTo(LaborRequest::class, 'labor_request_id');
    }
}
