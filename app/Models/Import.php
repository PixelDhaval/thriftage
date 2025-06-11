<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Import extends Model
{
    protected $fillable = [
        'party_id',
        'container_no',
        'movement_date',
        'bl_no',
        'bl_date',
        'be_no',
        'be_date',
        'bl_weight',
        'weigh_bridge_weight',
        'type'
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function bags()
    {
        return $this->hasMany(ImportBag::class);
    }

    public function partyWiseBagsCount(){
        return $this->bags()
            ->selectRaw('import_id, party_id, COUNT(*) as bags_count')
            ->groupBy('import_id', 'party_id');
    }

    /**
     * Get party-wise opened bags count for this import
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function partyWiseOpenedBags()
    {
        return $this->bags()
            ->where('status', 'opened')
            ->selectRaw('import_id, party_id, COUNT(*) as opened_bags_count')
            ->groupBy('import_id', 'party_id');
    }

    /**
     * Get party-wise unopened bags count for this import
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function partyWiseUnopenedBags()
    {
        return $this->bags()
            ->where('status', 'unopened')
            ->selectRaw('import_id, party_id, COUNT(*) as unopened_bags_count')
            ->groupBy('import_id', 'party_id');
    }
    
    /**
     * Get total opened bags count for this import
     * 
     * @return int
     */
    public function getTotalOpenedBagsCount()
    {
        return $this->bags()->where('status', 'opened')->count();
    }
    
    /**
     * Get total unopened bags count for this import
     * 
     * @return int
     */
    public function getTotalUnopenedBagsCount()
    {
        return $this->bags()->where('status', 'unopened')->count();
    }
    
    /**
     * Get total bags count for this import
     * 
     * @return int
     */
    public function getTotalBagsCount()
    {
        return $this->bags()->count();
    }
    
    /**
     * Get party-wise bag counts with opened/unopened status
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getPartyWiseBagStatusSummary()
    {
        return $this->bags()
            ->selectRaw('import_id, party_id, status, COUNT(*) as count')
            ->with('party')
            ->groupBy('import_id', 'party_id', 'status')
            ->get()
            ->groupBy('party_id');
    }
    
    /**
     * Get comprehensive bag summary for this import
     * 
     * @return array
     */
    public function getBagsSummary()
    {
        $partyWiseSummary = $this->getPartyWiseBagStatusSummary();
        $totalOpened = $this->getTotalOpenedBagsCount();
        $totalUnopened = $this->getTotalUnopenedBagsCount();
        $totalBags = $this->getTotalBagsCount();
        
        return [
            'party_wise' => $partyWiseSummary,
            'totals' => [
                'opened' => $totalOpened,
                'unopened' => $totalUnopened,
                'total' => $totalBags
            ]
        ];
    }
}
