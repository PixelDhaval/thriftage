<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExportStock extends Model
{
    protected $fillable = ['item_id', 'weight_id', 'quantity'];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function weight()
    {
        return $this->belongsTo(Weight::class);
    }
}
