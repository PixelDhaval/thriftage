<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InProcessStock extends Model
{
    protected $fillable = ['party_id', 'weight'];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }
}
