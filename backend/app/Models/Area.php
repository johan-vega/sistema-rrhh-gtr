<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    protected $fillable = ['name', 'description', 'max_simultaneous_permissions', 'monthly_permission_limit', 'monthly_absence_limit', 'active'];

    protected function casts(): array
    {
        return ['max_simultaneous_permissions' => 'integer', 'active' => 'boolean', 'monthly_permission_limit' => 'integer', 'monthly_absence_limit' => 'integer'];
    }

    public function workers()
    {
        return $this->hasMany(Worker::class);
    }
}
