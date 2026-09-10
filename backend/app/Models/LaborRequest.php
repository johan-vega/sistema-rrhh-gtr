<?php

namespace App\Models;

use App\Enums\RequestStatus;
use Illuminate\Database\Eloquent\Model;

class LaborRequest extends Model
{
    protected $fillable = ['worker_id', 'category_id', 'start_date', 'end_date', 'reason', 'status', 'requested_at', 'responded_at', 'hr_observation'];

    protected function casts(): array
    {
        return ['start_date' => 'date:Y-m-d', 'end_date' => 'date:Y-m-d', 'requested_at' => 'datetime', 'responded_at' => 'datetime', 'status' => RequestStatus::class];
    }

    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }

    public function category()
    {
        return $this->belongsTo(RequestCategory::class, 'category_id');
    }

    public function documents()
    {
        return $this->hasMany(RequestDocument::class);
    }

    public function histories()
    {
        return $this->hasMany(RequestHistory::class);
    }
}
