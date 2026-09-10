<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public const HR = 'RRHH';

    public const WORKER = 'TRABAJADOR';

    protected $fillable = ['name', 'code'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
