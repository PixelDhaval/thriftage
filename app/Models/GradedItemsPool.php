<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradedItemsPool extends Model
{
    protected $fillable = ['party_id', 'import_id', 'section_id', 'grade_id', 'weight', 'graded_at'];

    protected $casts = [
        'graded_at' => 'date',
        'weight' => 'decimal:2',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function import()
    {
        return $this->belongsTo(Import::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }
}
