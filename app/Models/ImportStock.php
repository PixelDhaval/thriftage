<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImportStock extends Model
{
    protected $fillable = ['party_id', 'weight_id', 'quantity'];


    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function weight()
    {
        return $this->belongsTo(Weight::class);
    }
}
