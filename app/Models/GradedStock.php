<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradedStock extends Model
{
    protected $fillable = ['item_id', 'grade_id', 'weight'];

    protected $casts = [
        'weight' => 'decimal:2',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    /**
     * Check if sufficient stock is available
     */
    public static function checkAvailability($itemId, $gradeId, $requiredWeight)
    {
        $stock = self::where('item_id', $itemId)
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

    /**
     * Deduct stock for graded bag creation
     */
    public static function deductStock($itemId, $gradeId, $weight)
    {
        $stock = self::where('item_id', $itemId)
            ->where('grade_id', $gradeId)
            ->first();

        if ($stock && $stock->weight >= $weight) {
            $stock->weight -= $weight;
            $stock->save();
            return true;
        }

        return false;
    }
}
