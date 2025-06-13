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
        $query = GradedBagsPool::with(['weight', 'item.section', 'grade']);
        if ($request->has('from_created_date') && $request->filled('from_created_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_created_date'));
        }
        if ($request->has('to_created_date') && $request->filled('to_created_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_created_date'));
        }
        $query->select([
            'item_id',
            'grade_id',
            'weight_id',
            DB::raw('DATE(created_at) as created_date'),
            DB::raw('COUNT(*) as total_quantity')
        ])->groupBy('item_id', 'grade_id', 'weight_id', DB::raw('DATE(created_at)'));

        // Handle search
        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $searchColumn = $request->input('search_column');

            if ($searchColumn && $searchColumn !== 'all') {
                switch ($searchColumn) {
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
                    case 'created_date':
                        $query->whereDate('created_at', $searchTerm);
                        break;
                    case 'total_quantity':
                        $query->having('total_quantity', 'like', "%{$searchTerm}%");
                        break;
                }
            } else {
                // Global search
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereHas('item', function ($q) use ($searchTerm) {
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
                case 'created_date':
                    $query->orderBy(DB::raw('DATE(created_at)'), $sortDirection);
                    break;
                default:
                    $query->orderBy(DB::raw('DATE(created_at)'), 'desc');
                    break;
            }
        } else {
            $query->orderBy(DB::raw('DATE(created_at)'), 'desc')
                ->orderBy('total_quantity', 'desc');
        }

        // Handle pagination
        if ($request->has('page') && $request->filled('page')) {
            $perPage = $request->input('per_page', 10);
            $results = $query->paginate($perPage);
        } else {
            $results = $query->get();
        }

        // Load relationships for each group
        if (isset($results->items)) {
            foreach ($results->items() as $item) {
                $item->weight = $item->weight;
                $item->item = $item->item;
                $item->grade = $item->grade;
            }
        } else {
            foreach ($results as $item) {
                $item->weight = $item->weight;
                $item->item = $item->item;
                $item->grade = $item->grade;
            }
        }

        return response()->json($results);
    }

    public function getGradedBagsPoolsForSelect(Request $request)
    {
        $query = GradedBagsPool::with(['weight', 'item.section', 'grade']);

        if ($request->has('weight_id') && $request->filled('weight_id')) {
            $query->where('weight_id', $request->input('weight_id'));
        }

        if ($request->has('item_id') && $request->filled('item_id')) {
            $query->where('item_id', $request->input('item_id'));
        }

        if ($request->has('grade_id') && $request->filled('grade_id')) {
            $query->where('grade_id', $request->input('grade_id'));
        }

        if ($request->has('status') && $request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('item', function ($q) use ($searchTerm) {
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

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-bags-pools-create')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'item_id' => 'required|exists:items,id',
            'grade_id' => 'required|exists:grades,id',
            'weight_id' => 'required|exists:weights,id',
            'quantity' => 'required|integer|min:1|max:100',
        ]);

        // Check stock availability
        $weight = \App\Models\Weight::find($request->input('weight_id'));
        $requiredWeight = $request->input('quantity') * $weight->weight;

        $gradedStock = \App\Models\GradedStock::where('item_id', $request->input('item_id'))
            ->where('grade_id', $request->input('grade_id'))
            ->first();

        $availableWeight = $gradedStock ? $gradedStock->weight : 0;

        if ($requiredWeight > $availableWeight) {
            return response()->json([
                'message' => "Insufficient graded stock available. Required: {$requiredWeight}kg, Available: {$availableWeight}kg",
                'errors' => [
                    'quantity' => ["Insufficient stock. Available: {$availableWeight}kg, Required: {$requiredWeight}kg"]
                ]
            ], 422);
        }

        $graded_bags_pools = [];

        DB::transaction(function () use ($request, &$graded_bags_pools, $requiredWeight) {
            for ($i = 0; $i < $request->input('quantity'); $i++) {
                $graded_bags_pool = GradedBagsPool::create([
                    'item_id' => $request->input('item_id'),
                    'grade_id' => $request->input('grade_id'),
                    'weight_id' => $request->input('weight_id'),
                ]);
                $graded_bags_pools[] = $graded_bags_pool->load(['item.section', 'grade', 'weight']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Graded bags pool created successfully.',
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
            'item_id' => 'required|exists:items,id',
            'grade_id' => 'required|exists:grades,id',
            'weight_id' => 'required|exists:weights,id',
            'quantity' => 'required|integer|min:1|max:10', // Limit batch size to 10
        ]);

        // Check stock availability
        $weight = \App\Models\Weight::find($request->input('weight_id'));
        $requiredWeight = $request->input('quantity') * $weight->weight;

        $gradedStock = \App\Models\GradedStock::where('item_id', $request->input('item_id'))
            ->where('grade_id', $request->input('grade_id'))
            ->first();

        $availableWeight = $gradedStock ? $gradedStock->weight : 0;

        if ($requiredWeight > $availableWeight) {
            return response()->json([
                'error' => "Insufficient graded stock available. Required: {$requiredWeight}kg, Available: {$availableWeight}kg"
            ], 422);
        }

        $graded_bags_pools = [];

        DB::transaction(function () use ($request, &$graded_bags_pools, $requiredWeight) {
            for ($i = 0; $i < $request->input('quantity'); $i++) {
                $graded_bags_pool = GradedBagsPool::create([
                    'item_id' => $request->input('item_id'),
                    'grade_id' => $request->input('grade_id'),
                    'weight_id' => $request->input('weight_id'),
                ]);
                $graded_bags_pools[] = $graded_bags_pool->load(['item.section', 'grade', 'weight']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Batch of {$request->input('quantity')} graded bags created successfully.",
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
        $query = GradedBagsPool::with(['weight', 'item.section', 'grade']);

        // Filter by weight_id
        if ($request->has('weight_id') && $request->filled('weight_id')) {
            $query->where('weight_id', $request->input('weight_id'));
        }

        // Filter by item_id
        if ($request->has('item_id') && $request->filled('item_id')) {
            $query->where('item_id', $request->input('item_id'));
        }

        // Filter by grade_id
        if ($request->has('grade_id') && $request->filled('grade_id')) {
            $query->where('grade_id', $request->input('grade_id'));
        }

        // Filter by created_date
        if ($request->has('created_date') && $request->filled('created_date')) {
            $query->whereDate('created_at', $request->input('created_date'));
        }

        // Filter by created_date
        if ($request->has('from_created_date') && $request->filled('from_created_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_created_date'));
        }

        if ($request->has('to_created_date') && $request->filled('to_created_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_created_date'));
        }
        // Handle sorting
        if ($request->has('sort_column') && $request->filled('sort_column')) {
            $sortColumn = $request->input('sort_column');
            $sortDirection = $request->input('sort_direction', 'asc');

            switch ($sortColumn) {
                case 'barcode':
                case 'created_at':
                    $query->orderBy($sortColumn, $sortDirection);
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
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }
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
                    case 'created_at':
                        $query->whereDate('created_at', $searchTerm);
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
                // Global search
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('barcode', 'like', "%{$searchTerm}%")
                        ->orWhere('status', 'like', "%{$searchTerm}%")
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

        // Handle pagination
        if ($request->has('page') && $request->filled('page')) {
            $perPage = $request->input('per_page', 10);
            $results = $query->paginate($perPage);
        } else {
            $results = $query->get();
        }

        return response()->json($results);
    }
}
