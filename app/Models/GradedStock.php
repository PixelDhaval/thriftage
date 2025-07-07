<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradedStock extends Model
{
    protected $fillable = ['section_id', 'grade_id', 'weight', 'pair'];

    protected $casts = [
        'weight' => 'decimal:2',
    ];

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    /**
     * Check if sufficient stock is available
     */
    public static function checkAvailability($sectionId, $gradeId, $requiredWeight)
    {
        $stock = self::where('section_id', $sectionId)
            ->where('grade_id', $gradeId)
            ->first();

        $availableWeight = $stock ? $stock->weight : 0;

        return [
            'available_weight' => $availableWeight,
            'required_weight' => $requiredWeight,
            'is_sufficient' => $availableWeight >= $requiredWeight,
            'shortage' => $availableWeight < $requiredWeight ? ($requiredWeight - $availableWeight) : 0
        ];
    }
}
