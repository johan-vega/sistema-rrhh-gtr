<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestHistory extends Model
{
    public $timestamps = false;

    protected $fillable = ['labor_request_id', 'user_id', 'action', 'comment', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
