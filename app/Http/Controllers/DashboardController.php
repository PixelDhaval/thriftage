<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ImportBag;
use App\Models\GradedBagsPool;
use App\Models\GradedItemsPool;
use App\Models\Import;
use App\Models\Item;
use App\Models\Section;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('dashboard');
    }

    public function getDashboardData()
    {
        // Key statistics
        $stats = [
            'totalBags' => ImportBag::count(),
            'openedBags' => ImportBag::where('status', 'opened')->count(),
            'unopenedBags' => ImportBag::where('status', 'unopened')->count(),
            'gradedBags' => GradedBagsPool::count(),
            'gradedItems' => GradedItemsPool::count(),
            'totalWeight' => GradedItemsPool::sum('weight'),
            'importStats' => [
                'total' => Import::count(),
                'container' => Import::where('type', 'container')->count(),
                'local' => Import::where('type', 'local')->count(),
            ]
        ];

        // Bag distribution data
        $bagDistribution = [
            ['name' => 'Opened', 'value' => $stats['openedBags']],
            ['name' => 'Unopened', 'value' => $stats['unopenedBags']],
        ];

        // Items by section distribution
        $itemsBySection = DB::table('items')
            ->join('sections', 'items.section_id', '=', 'sections.id')
            ->select('sections.name', DB::raw('COUNT(*) as count'))
            ->groupBy('sections.name')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get()
            ->toArray();

        // Graded weight by section
        $gradedBySection = DB::table('graded_items_pools')
            ->join('sections', 'graded_items_pools.section_id', '=', 'sections.id')
            ->select('sections.name', DB::raw('SUM(graded_items_pools.weight) as value'))
            ->groupBy('sections.name')
            ->orderBy('value', 'desc')
            ->limit(10)
            ->get()
            ->toArray();

        // Recent activity
        $recentActivity = $this->getRecentActivity();

        return response()->json([
            'stats' => $stats,
            'bagDistribution' => $bagDistribution,
            'itemsBySection' => $itemsBySection,
            'gradedBySection' => $gradedBySection,
            'recentActivity' => $recentActivity
        ]);
    }

    protected function getRecentActivity()
    {
        $activities = [];

        // Recent imports
        $recentImports = Import::with('party')
            ->orderBy('created_at', 'desc')
            ->limit(2)
            ->get();
        
        foreach ($recentImports as $import) {
            $activities[] = [
                'icon' => 'package',
                'iconBg' => 'bg-blue-100 text-blue-700',
                'title' => 'New Import Added',
                'description' => $import->type == 'container' 
                    ? "Container #{$import->container_no} was imported from {$import->party->name}"
                    : "Local import from {$import->party->name} was added",
                'timestamp' => Carbon::parse($import->created_at)->diffForHumans()
            ];
        }

        // Recently opened bags
        $openedBags = ImportBag::where('status', 'opened')
            ->orderBy('updated_at', 'desc')
            ->limit(2)
            ->get();
            
        if (count($openedBags) > 0) {
            $groupedByImport = $openedBags->groupBy('import_id');
            
            foreach ($groupedByImport as $importId => $bags) {
                $import = Import::find($importId);
                $count = count($bags);
                
                $activities[] = [
                    'icon' => 'packageOpen',
                    'iconBg' => 'bg-green-100 text-green-700',
                    'title' => "{$count} Bags Opened",
                    'description' => $import ? 
                        ($import->type == 'container' ? 
                            "Bags from Container #{$import->container_no} were opened" : 
                            "Bags from local import were opened") : 
                        "Bags were opened",
                    'timestamp' => Carbon::parse($bags->first()->updated_at)->diffForHumans()
                ];
            }
        }

        // Recently created graded items
        $gradedItems = GradedItemsPool::with(['section', 'grade'])
            ->orderBy('created_at', 'desc')
            ->limit(2)
            ->get();
            
        foreach ($gradedItems as $item) {
            $activities[] = [
                'icon' => 'layers',
                'iconBg' => 'bg-purple-100 text-purple-700',
                'title' => 'Graded Items Created',
                'description' => "{$item->weight} kg of items were graded in {$item->section->name} (Grade: {$item->grade->name})",
                'timestamp' => Carbon::parse($item->created_at)->diffForHumans()
            ];
        }

        // Recently created graded bags
        $gradedBags = GradedBagsPool::with(['item.section', 'grade'])
            ->orderBy('created_at', 'desc')
            ->limit(2)
            ->get()
            ->groupBy(['item_id', 'grade_id', 'weight_id']);
            
        foreach ($gradedBags as $itemGroup) {
            foreach ($itemGroup as $gradeGroup) {
                foreach ($gradeGroup as $weightGroup) {
                    $count = count($weightGroup);
                    $first = $weightGroup->first();
                    
                    $activities[] = [
                        'icon' => 'scale',
                        'iconBg' => 'bg-amber-100 text-amber-700',
                        'title' => "{$count} Graded Bags Created",
                        'description' => "Bags for {$first->item->name} (Grade: {$first->grade->name}) were created",
                        'timestamp' => Carbon::parse($first->created_at)->diffForHumans()
                    ];
                }
            }
        }

        // Sort by most recent
        usort($activities, function($a, $b) {
            return strtotime(str_replace(' ago', '', $b['timestamp'])) - strtotime(str_replace(' ago', '', $a['timestamp']));
        });

        return array_slice($activities, 0, 5);
    }
}
