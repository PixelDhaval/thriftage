<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ImportBag extends Model
{
    protected $fillable = ['import_id', 'party_id', 'weight_id', 'barcode', 'status'];
    
    protected $with = ['party'];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->barcode)) {
                $model->barcode = self::generateBarcode();
            }
            if (empty($model->status)) {
                $model->status = 'unopened';
            }
        });
    }

    public function import()
    {
        return $this->belongsTo(Import::class);
    }

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function weight()
    {
        return $this->belongsTo(Weight::class);
    }

    /**
     * Generate barcode in format I + YYMMDD + 0001
     * 
     * @return string
     */
    public static function generateBarcode()
    {
        $today = Carbon::now()->format('ymd');
        
        // Get today's last barcode number for ImportBag (with 'I' prefix)
        $lastBarcode = self::whereDate('created_at', Carbon::today())
            ->where('barcode', 'LIKE', 'I' . $today . '%')
            ->orderBy('barcode', 'desc')
            ->first();
        
        $nextNumber = 1;
        if ($lastBarcode) {
            $lastNumber = (int) substr($lastBarcode->barcode, -4);
            $nextNumber = $lastNumber + 1;
        }

        $barcodeNumber = str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        return 'I' . $today . $barcodeNumber;
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
        
        // Get today's last barcode number for ImportBag (with 'I' prefix)
        $lastBarcode = self::whereDate('created_at', Carbon::today())
            ->where('barcode', 'LIKE', 'I' . $today . '%')
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
            $barcodes[] = 'I' . $today . $barcodeNumber;
        }

        return $barcodes;
    }
}
