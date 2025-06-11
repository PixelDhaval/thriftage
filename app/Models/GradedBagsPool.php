<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class GradedBagsPool extends Model
{
    protected $fillable = ['party_id', 'import_id', 'weight_id', 'item_id', 'grade_id', 'barcode'];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->barcode)) {
                $model->barcode = self::generateBarcode();
            }
        });
    }

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function import()
    {
        return $this->belongsTo(Import::class);
    }

    public function weight()
    {
        return $this->belongsTo(Weight::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    /**
     * Generate barcode in format G + YYMMDD + 0001
     * 
     * @return string
     */
    public static function generateBarcode()
    {
        $today = Carbon::now()->format('ymd');
        
        // Get today's last barcode number for GradedBagsPool (with 'G' prefix)
        $lastBarcode = self::whereDate('created_at', Carbon::today())
            ->where('barcode', 'LIKE', 'G' . $today . '%')
            ->orderBy('barcode', 'desc')
            ->first();
        
        $nextNumber = 1;
        if ($lastBarcode) {
            $lastNumber = (int) substr($lastBarcode->barcode, -4);
            $nextNumber = $lastNumber + 1;
        }

        $barcodeNumber = str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        return 'G' . $today . $barcodeNumber;
    }

    /**
     * Generate multiple barcodes for bulk creation
     * 
     * @param int $quantity
     * @return array
     */
    public static function generateBarcodes($quantity)
    {
        $today = Carbon::now()->format('ymd');
        
        // Get today's last barcode number for GradedBagsPool (with 'G' prefix)
        $lastBarcode = self::whereDate('created_at', Carbon::today())
            ->where('barcode', 'LIKE', 'G' . $today . '%')
            ->orderBy('barcode', 'desc')
            ->first();
        
        $startNumber = 1;
        if ($lastBarcode) {
            $lastNumber = (int) substr($lastBarcode->barcode, -4);
            $startNumber = $lastNumber + 1;
        }

        $barcodes = [];
        for ($i = 0; $i < $quantity; $i++) {
            $barcodeNumber = str_pad($startNumber + $i, 4, '0', STR_PAD_LEFT);
            $barcodes[] = 'G' . $today . $barcodeNumber;
        }

        return $barcodes;
    }
}
