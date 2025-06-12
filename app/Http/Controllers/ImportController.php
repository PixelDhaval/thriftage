<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreImportRequest;
use App\Http\Requests\UpdateImportRequest;
use App\Models\Permission;
use App\Models\Import;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('imports-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('Imports/Index');
    }

    public function getImports(Request $request)
    {
        $query = Import::with('party', 'bags');
        if ($request->has('sort_column') && $request->filled('sort_column')) {
            $query->orderBy($request->input('sort_column'), $request->input('sort_direction'));
        } else {
            $query->orderBy('movement_date', 'desc');
        }

        if ($request->has('party_id') && $request->filled('party_id')) {
            $query->where('party_id', $request->input('party_id'));
        }

        if ($request->has('type') && $request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if($request->has('from_movement_date') && $request->filled('from_movement_date')){
            $query->whereDate('movement_date', '>=', $request->input('from_movement_date'));
        }

        if($request->has('to_movement_date') && $request->filled('to_movement_date')){
            $query->whereDate('movement_date', '<=', $request->input('to_movement_date'));
        }

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $searchColumn = $request->input('search_column');

            if ($searchColumn && $searchColumn !== 'all') {
                // Handle specific column search
                switch ($searchColumn) {
                    case 'container_no':
                    case 'bl_no':
                    case 'be_no':
                    case 'type':
                        $query->where($searchColumn, 'like', "%{$searchTerm}%");
                        break;
                    case 'party':
                        $query->whereHas('party', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                }
            } else {
                // Handle global search across all searchable columns
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('container_no', 'like', "%{$searchTerm}%")
                        ->orWhere('bl_no', 'like', "%{$searchTerm}%")
                        ->orWhere('be_no', 'like', "%{$searchTerm}%")
                        ->orWhere('type', 'like', "%{$searchTerm}%")
                        ->orWhereHas('party', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                });
            }
        }

        if ($request->has('page') && $request->filled('page')) {

            $perPage = $request->input('per_page', 10);
            $users = $query->paginate($perPage);
        } else {
            $users = $query->get();
        }


        return response()->json($users);
    }

    public function getImportsForSelect(Request $request)
    {
        $query = Import::with('section', 'createdBy', 'updatedBy');

        if ($request->has('party_id') && $request->filled('party_id')) {
            $query->where('party_id', $request->input('party_id'));
        }

        if ($request->has('type') && $request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where('container_no', 'like', "%{$searchTerm}%")
                ->orWhere('bl_no', 'like', "%{$searchTerm}%")
                ->orWhere('be_no', 'like', "%{$searchTerm}%")
                ->orWhere('type', 'like', "%{$searchTerm}%")
                ->orWhereHas('party', function ($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%");
                });
        }

        $imports = $query->get();
        return response()->json($imports);
    }

    public function store(StoreImportRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('imports-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $import = Import::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Import created successfully.',
        ]);
    }

    public function show(Import $import)
    {
        $user = Auth::user();
        if (!$user->hasPermission('imports-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('Imports/Show', [
            'import' => $import->load('party')
        ]);
    }

    public function update(UpdateImportRequest $request, Import $import)
    {
        $user = Auth::user();
        if (!$user->hasPermission('imports-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $import->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Import updated successfully.'
        ]);
    }

    public function destroy(Import $import)
    {
        $user = Auth::user();
        if (!$user->hasPermission('imports-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $import->delete();
        return response()->json([
            'success' => true,
            'message' => 'Import deleted successfully.'
        ]);
    }

    public function getImportStats(Import $import)
    {
        $user = Auth::user();
        if (!$user->hasPermission('imports-read')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $stats = [
            'total_bags' => $import->bags()->count(),
            'opened_bags' => $import->bags()->where('status', 'opened')->count(),
            'unopened_bags' => $import->bags()->where('status', 'unopened')->count(),
        ];

        return response()->json($stats);
    }

    public function getAvailableOpenedGoods(Import $import)
    {
        $user = Auth::user();
        if (!$user->hasPermission('imports-read')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get opened bags weight by party and weight
        $openedBagsWeight = $import->bags()
            ->where('status', 'opened')
            ->join('weights', 'import_bags.weight_id', '=', 'weights.id')
            ->selectRaw('import_bags.party_id, import_bags.weight_id, SUM(weights.weight) as total_opened_weight')
            ->groupBy('import_bags.party_id', 'import_bags.weight_id')
            ->get();

        // Get graded items weight by party (sum all weights from graded_items_pools)
        $gradedItemsWeight = DB::table('graded_items_pools')
            ->where('import_id', $import->id)
            ->selectRaw('party_id, SUM(weight) as total_graded_weight')
            ->groupBy('party_id')
            ->get();

        // Calculate available weight by party
        $availableGoods = [];
        
        // Group opened bags by party to get total opened weight per party
        $partyOpenedWeights = [];
        foreach ($openedBagsWeight as $openedItem) {
            if (!isset($partyOpenedWeights[$openedItem->party_id])) {
                $partyOpenedWeights[$openedItem->party_id] = 0;
            }
            $partyOpenedWeights[$openedItem->party_id] += $openedItem->total_opened_weight;
        }

        // Calculate available weight for each party
        foreach ($partyOpenedWeights as $partyId => $totalOpenedWeight) {
            $gradedWeight = $gradedItemsWeight
                ->where('party_id', $partyId)
                ->first();
            
            $gradedWeightTotal = $gradedWeight ? $gradedWeight->total_graded_weight : 0;
            $availableWeight = $totalOpenedWeight - $gradedWeightTotal;
            
            if ($availableWeight > 0) {
                $availableGoods[] = [
                    'party_id' => $partyId,
                    'opened_weight' => $totalOpenedWeight,
                    'graded_weight' => $gradedWeightTotal,
                    'available_weight' => $availableWeight,
                ];
            }
        }

        // Load party relationships
        foreach ($availableGoods as $key => $item) {
            $party = \App\Models\Party::find($item['party_id']);
            $availableGoods[$key]['party'] = $party;
        }

        return response()->json($availableGoods);
    }
}
