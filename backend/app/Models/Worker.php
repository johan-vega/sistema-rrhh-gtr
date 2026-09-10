<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    protected $fillable = ['user_id', 'dni', 'first_name', 'last_name', 'area_id', 'position_id', 'address', 'phone', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function requests()
    {
        return $this->hasMany(LaborRequest::class);
    }
}
