<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestCategory extends Model
{
    protected $fillable = ['name', 'description', 'requires_document', 'minimum_notice_days', 'active', 'allow_approved_cancellation', 'is_absence'];

    protected function casts(): array
    {
        return ['requires_document' => 'boolean', 'active' => 'boolean', 'allow_approved_cancellation' => 'boolean', 'is_absence' => 'boolean'];
    }

    public function requests()
    {
        return $this->hasMany(LaborRequest::class, 'category_id');
    }
}
