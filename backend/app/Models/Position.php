<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    protected $fillable = ['name', 'description', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function workers()
    {
        return $this->hasMany(Worker::class);
    }
}
