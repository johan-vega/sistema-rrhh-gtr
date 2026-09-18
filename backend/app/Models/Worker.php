<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    protected $fillable = ['user_id', 'dni', 'first_name', 'last_name', 'area_id', 'position_id', 'address', 'phone', 'dni_address', 'emergency_phone', 'worker_type', 'birth_date', 'hire_date', 'photo_path', 'monthly_permission_limit', 'monthly_absence_limit', 'active'];

    protected function casts(): array
    {
        return ['birth_date' => 'date', 'hire_date' => 'date', 'active' => 'boolean', 'monthly_permission_limit' => 'integer', 'monthly_absence_limit' => 'integer'];
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
