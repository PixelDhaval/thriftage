<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreImportBagRequest;
use App\Http\Requests\UpdateImportBagRequest;
use App\Models\Permission;
use App\Models\ImportBag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ImportBagController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('import-bags-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('ImportBags/Index');
    }

   public function getImportBags(Request $request)
    {
        $importId = $request->input('import_id');
        
        if (!$importId) {
            return response()->json([]);
        }

        $query = ImportBag::where('import_id', $importId)
            ->with(['party', 'weight'])
            ->select([
                'party_id',
                'weight_id',
                DB::raw('COUNT(*) as bag_count'),
                DB::raw('SUM(CASE WHEN status = "opened" THEN 1 ELSE 0 END) as opened_count'),
                DB::raw('SUM(CASE WHEN status = "unopened" THEN 1 ELSE 0 END) as unopened_count')
            ])
            ->groupBy('party_id', 'weight_id');

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $searchColumn = $request->input('search_column');

            if ($searchColumn && $searchColumn !== 'all') {
                switch ($searchColumn) {
                    case 'party.name':
                        $query->whereHas('party', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                    case 'status':
                        $query->having('status', 'like', "%{$searchTerm}%");
                        break;
                }
            } else {
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereHas('party', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    });
                });
            }
        }

        if ($request->has('page') && $request->filled('page')) {
            $perPage = $request->input('per_page', 10);
            $results = $query->paginate($perPage);
        } else {
            $results = $query->get();
        }

        // Load relationships for each group
        if (isset($results->items)) {
            foreach ($results->items() as $item) {
                $item->party = $item->party;
                $item->weight = $item->weight;
            }
        } else {
            foreach ($results as $item) {
                $item->party = $item->party;
                $item->weight = $item->weight;
            }
        }

        return response()->json($results);
    }

    public function getImportBagsForSelect(Request $request)
    {
        $query = ImportBag::with('party', 'import');

        if ($request->has('party_id') && $request->filled('party_id')) {
            $query->where('party_id', $request->input('party_id'));
        }

        if($request->has('import_id') && $request->filled('import_id')){
            $query->where('import_id', $request->input('import_id'));
        }
        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                    $q->whereHas('import', function ($q) use ($searchTerm) {
                        $q->where('container_no', 'like', "%{$searchTerm}%")
                            ->orWhere('bl_no', 'like', "%{$searchTerm}%")
                            ->orWhere('be_no', 'like', "%{$searchTerm}%")
                            ->orWhere('type', 'like', "%{$searchTerm}%");
                    })
                        ->orWhereHas('party', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        })
                        ->orWhere('barcode', 'like', "%{$searchTerm}%");
                });
        }

        $import_bags = $query->get();
        return response()->json($import_bags);
    }

    public function store(StoreImportBagRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('import-bags-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $import_bags = [];

        $validatedData = $request->validated();
        for($i = 0; $i < $validatedData['quantity']; $i++){
            $import_bag = ImportBag::create([
                'import_id' => $validatedData['import_id'],
                'party_id' => $validatedData['party_id'],
                'weight_id' => $validatedData['weight_id'],
            ]);
            $import_bags[] = $import_bag;
        }

        return response()->json([
            'success' => true,
            'message' => 'ImportBag created successfully.',
            'import_bags' => $import_bags
        ]);
    }

    public function storeBatch(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('import-bags-create')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'import_id' => 'required|exists:imports,id',
            'party_id' => 'required|exists:parties,id',
            'weight_id' => 'required|exists:weights,id',
            'quantity' => 'required|integer|min:1|max:10', // Limit batch size to 10
        ]);

        $import_bags = [];

        for($i = 0; $i < $request->input('quantity'); $i++){
            $import_bag = ImportBag::create([
                'import_id' => $request->input('import_id'),
                'party_id' => $request->input('party_id'),
                'weight_id' => $request->input('weight_id'),
            ]);
            $import_bags[] = $import_bag;
        }


        return response()->json([
            'success' => true,
            'message' => "Batch of {$request->input('quantity')} bags created successfully.",
            'import_bags' => $import_bags
        ]);
    }

    public function update(UpdateImportBagRequest $request, ImportBag $import_bag)
    {
        $user = Auth::user();
        if (!$user->hasPermission('import-bags-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $import_bag->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'ImportBag updated successfully.'
        ]);
    }

    public function destroy(ImportBag $import_bag)
    {
        $user = Auth::user();
        if (!$user->hasPermission('import-bags-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $import_bag->delete();
        return response()->json([
            'success' => true,
            'message' => 'ImportBag deleted successfully.'
        ]);
    }

    public function getImportBagsWithBarcodes(Request $request)
    {
        $query = ImportBag::with('party', 'weight', 'import');

        // Filter by import_id
        if ($request->has('import_id') && $request->filled('import_id')) {
            $query->where('import_id', $request->input('import_id'));
        }

        // Filter by party_id
        if ($request->has('party_id') && $request->filled('party_id')) {
            $query->where('party_id', $request->input('party_id'));
        }

        // Filter by weight_id
        if ($request->has('weight_id') && $request->filled('weight_id')) {
            $query->where('weight_id', $request->input('weight_id'));
        }

        // Filter by status - add this for the bags opening workflow
        if ($request->has('status') && $request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Handle sorting
        if ($request->has('sort_column') && $request->filled('sort_column')) {
            $query->orderBy($request->input('sort_column'), $request->input('sort_direction', 'asc'));
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Handle search
        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $searchColumn = $request->input('search_column');

            if ($searchColumn && $searchColumn !== 'all') {
                switch ($searchColumn) {
                    case 'barcode':
                        $query->where('barcode', 'like', "%{$searchTerm}%");
                        break;
                    case 'status':
                        $query->where('status', 'like', "%{$searchTerm}%");
                        break;
                    case 'created_at':
                        $query->whereDate('created_at', $searchTerm);
                        break;
                    case 'party.name':
                        $query->whereHas('party', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                    case 'weight.weight':
                        $query->whereHas('weight', function ($q) use ($searchTerm) {
                            $q->where('weight', 'like', "%{$searchTerm}%");
                        });
                        break;
                    case 'import.container_no':
                        $query->whereHas('import', function ($q) use ($searchTerm) {
                            $q->where('container_no', 'like', "%{$searchTerm}%");
                        });
                        break;
                }
            } else {
                // Global search
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('barcode', 'like', "%{$searchTerm}%")
                      ->orWhere('status', 'like', "%{$searchTerm}%")
                      ->orWhereHas('party', function ($q) use ($searchTerm) {
                          $q->where('name', 'like', "%{$searchTerm}%");
                      })
                      ->orWhereHas('import', function ($q) use ($searchTerm) {
                          $q->where('container_no', 'like', "%{$searchTerm}%");
                      });
                });
            }
        }

        // Handle pagination
        if ($request->has('page') && $request->filled('page')) {
            $perPage = $request->input('per_page', 10);
            $results = $query->paginate($perPage);
        } else {
            $results = $query->get();
        }

        return response()->json($results);
    }

    public function updateByBarcode(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('import-bags-update')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'barcode' => 'required|string',
        ]);

        $barcode = $request->input('barcode');
        
        // Find the import bag by barcode
        $importBag = ImportBag::where('barcode', $barcode)->with(['party', 'weight', 'import'])->first();
        
        if (!$importBag) {
            return response()->json([
                'success' => false,
                'message' => 'Bag not found with barcode: ' . $barcode,
                'type' => 'not_found'
            ], 404);
        }

        // Check current status and toggle
        if ($importBag->status === 'opened') {
            return response()->json([
                'success' => false,
                'message' => 'Bag is already opened. Do you want to change status to unopened?',
                'type' => 'already_opened',
                'bag' => $importBag
            ], 200);
        } else {
            // Change from unopened to opened
            $importBag->update(['status' => 'opened']);
            
            return response()->json([
                'success' => true,
                'message' => "Bag {$barcode} marked as opened successfully.",
                'type' => 'status_changed',
                'bag' => $importBag,
                'new_status' => 'opened'
            ]);
        }
    }

    public function toggleStatusByBarcode(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('import-bags-update')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'barcode' => 'required|string',
            'new_status' => 'required|in:opened,unopened',
        ]);

        $barcode = $request->input('barcode');
        $newStatus = $request->input('new_status');
        
        $importBag = ImportBag::where('barcode', $barcode)->with(['party', 'weight', 'import'])->first();
        
        if (!$importBag) {
            return response()->json([
                'success' => false,
                'message' => 'Bag not found with barcode: ' . $barcode,
                'type' => 'not_found'
            ], 404);
        }

        $importBag->update(['status' => $newStatus]);
        
        return response()->json([
            'success' => true,
            'message' => "Bag {$barcode} marked as {$newStatus} successfully.",
            'type' => 'status_changed',
            'bag' => $importBag,
            'new_status' => $newStatus
        ]);
    }
}
