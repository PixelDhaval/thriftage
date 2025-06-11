<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGradedBagsPoolRequest;
use App\Http\Requests\UpdateGradedBagsPoolRequest;
use App\Models\Permission;
use App\Models\GradedBagsPool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GradedBagsPoolController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-bags-pools-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('GradedBagsPools/Index');
    }

    public function getGradedBagsPools(Request $request)
    {
        $importId = $request->input('import_id');

        if (!$importId) {
            return response()->json([]);
        }

        $query = GradedBagsPool::where('import_id', $importId)
            ->with(['party', 'weight', 'item', 'grade'])
            ->select([
                'party_id',
                'weight_id',
                'item_id',
                'grade_id',
                DB::raw('COUNT(*) as total_quantity')
            ])
            ->groupBy('party_id', 'weight_id', 'item_id', 'grade_id');

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
                    case 'item.name':
                        $query->whereHas('item', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                    case 'grade.name':
                        $query->whereHas('grade', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                    case 'weight.weight':
                        $query->whereHas('weight', function ($q) use ($searchTerm) {
                            $q->where('weight', 'like', "%{$searchTerm}%");
                        });
                        break;
                }
            } else {
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereHas('party', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    })
                        ->orWhereHas('item', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        })
                        ->orWhereHas('grade', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        })
                        ->orWhereHas('weight', function ($q) use ($searchTerm) {
                            $q->where('weight', 'like', "%{$searchTerm}%");
                        });
                });
            }
        }

        // Handle sorting
        if ($request->has('sort_column') && $request->filled('sort_column')) {
            $sortColumn = $request->input('sort_column');
            $sortDirection = $request->input('sort_direction', 'asc');

            switch ($sortColumn) {
                case 'party.name':
                    $query->join('parties', 'graded_bags_pools.party_id', '=', 'parties.id')
                        ->orderBy('parties.name', $sortDirection);
                    break;
                case 'item.name':
                    $query->join('items', 'graded_bags_pools.item_id', '=', 'items.id')
                        ->orderBy('items.name', $sortDirection);
                    break;
                case 'grade.name':
                    $query->join('grades', 'graded_bags_pools.grade_id', '=', 'grades.id')
                        ->orderBy('grades.name', $sortDirection);
                    break;
                case 'weight.weight':
                    $query->join('weights', 'graded_bags_pools.weight_id', '=', 'weights.id')
                        ->orderBy('weights.weight', $sortDirection);
                    break;
                case 'total_quantity':
                    $query->orderBy(DB::raw('COUNT(*)'), $sortDirection);
                    break;
                default:
                    $query->orderBy('total_quantity', 'desc');
                    break;
            }
        } else {
            $query->orderBy(DB::raw('COUNT(*)'), 'desc');
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
                $item->item = $item->item;
                $item->grade = $item->grade;
            }
        } else {
            foreach ($results as $item) {
                $item->party = $item->party;
                $item->weight = $item->weight;
                $item->item = $item->item;
                $item->grade = $item->grade;
            }
        }

        return response()->json($results);
    }

    public function getGradedBagsPoolsForSelect(Request $request)
    {
        $query = GradedBagsPool::with('party', 'import');

        if ($request->has('party_id') && $request->filled('party_id')) {
            $query->where('party_id', $request->input('party_id'));
        }

        if ($request->has('import_id') && $request->filled('import_id')) {
            $query->where('import_id', $request->input('import_id'));
        }

        if ($request->has('weight_id') && $request->filled('weight_id')) {
            $query->where('weight_id', $request->input('weight_id'));
        }

        if ($request->has('item_id') && $request->filled('item_id')) {
            $query->where('item_id', $request->input('item_id'));
        }

        if ($request->has('grade_id') && $request->filled('grade_id')) {
            $query->where('grade_id', $request->input('grade_id'));
        }

        if ($request->has('section_id') && $request->filled('section_id')) {
            $query->whereHas('import', function ($q) use ($request) {
                $q->where('section_id', $request->input('section_id'));
            });
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
                    ->orWhereHas('item', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%")
                            ->orWhereHas('section', function ($q) use ($searchTerm) {
                                $q->where('name', 'like', "%{$searchTerm}%");
                            });
                    })
                    ->orWhereHas('grade', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('weight', function ($q) use ($searchTerm) {
                        $q->where('weight', 'like', "%{$searchTerm}%");
                    })
                    ->orWhere('barcode', 'like', "%{$searchTerm}%");
            });
        }

        $graded_bags_pools = $query->get();
        return response()->json($graded_bags_pools);
    }

    public function store(StoreGradedBagsPoolRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-bags-pools-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $graded_bags_pools = [];

        $validatedData = $request->validated();
        for ($i = 0; $i < $validatedData['quantity']; $i++) {
            $graded_bags_pool = GradedBagsPool::create([
                'import_id' => $validatedData['import_id'],
                'party_id' => $validatedData['party_id'],
                'weight_id' => $validatedData['weight_id'],
            ]);
            $graded_bags_pools[] = $graded_bags_pool;
        }

        return response()->json([
            'success' => true,
            'message' => 'GradedBagsPool created successfully.',
            'graded_bags_pools' => $graded_bags_pools
        ]);
    }

    public function storeBatch(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-bags-pools-create')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'import_id' => 'required|exists:imports,id',
            'party_id' => 'required|exists:parties,id',
            'weight_id' => 'required|exists:weights,id',
            'quantity' => 'required|integer|min:1|max:10', // Limit batch size to 10
        ]);

        $graded_bags_pools = [];

        for ($i = 0; $i < $request->input('quantity'); $i++) {
            $graded_bags_pool = GradedBagsPool::create([
                'import_id' => $request->input('import_id'),
                'party_id' => $request->input('party_id'),
                'weight_id' => $request->input('weight_id'),
            ]);
            $graded_bags_pools[] = $graded_bags_pool;
        }


        return response()->json([
            'success' => true,
            'message' => "Batch of {$request->input('quantity')} bags created successfully.",
            'graded_bags_pools' => $graded_bags_pools
        ]);
    }

    public function update(UpdateGradedBagsPoolRequest $request, GradedBagsPool $graded_bags_pool)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-bags-pools-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $graded_bags_pool->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'GradedBagsPool updated successfully.'
        ]);
    }

    public function destroy(GradedBagsPool $graded_bags_pool)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-bags-pools-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $graded_bags_pool->delete();
        return response()->json([
            'success' => true,
            'message' => 'GradedBagsPool deleted successfully.'
        ]);
    }

    public function getGradedBagsPoolsWithBarcodes(Request $request)
    {
        $query = GradedBagsPool::with('party', 'weight', 'import');

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
        if (!$user->hasPermission('graded-bags-pools-update')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'barcode' => 'required|string',
        ]);

        $barcode = $request->input('barcode');

        // Find the import bag by barcode
        $importBag = GradedBagsPool::where('barcode', $barcode)->with(['party', 'weight', 'import'])->first();

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
        if (!$user->hasPermission('graded-bags-pools-update')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'barcode' => 'required|string',
            'new_status' => 'required|in:opened,unopened',
        ]);

        $barcode = $request->input('barcode');
        $newStatus = $request->input('new_status');

        $importBag = GradedBagsPool::where('barcode', $barcode)->with(['party', 'weight', 'import'])->first();

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
