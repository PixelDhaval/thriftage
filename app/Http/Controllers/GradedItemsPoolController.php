<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGradedItemsPoolRequest;
use App\Http\Requests\UpdateGradedItemsPoolRequest;
use App\Models\Permission;
use App\Models\GradedItemsPool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GradedItemsPoolController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-items-pools-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('GradedItemsPools/Index');
    }

    public function getGradedItemsPools(Request $request)
    {
        $query = GradedItemsPool::with(['party', 'import', 'item', 'item.section', 'grade']);

        // Filter by import_id
        if ($request->has('import_id') && $request->filled('import_id')) {
            $query->where('import_id', $request->input('import_id'));
        }

        if($request->has('party_id') && $request->filled('party_id')){
            $query->where('party_id', $request->input('party_id'));
        }

        if($request->has('item_id') && $request->filled('item_id')){
            $query->where('item_id', $request->input('item_id'));
        }

        if($request->has('grade_id') && $request->filled('grade_id')){
            $query->where('grade_id', $request->input('grade_id'));
        }

        if($request->has('section_id') && $request->filled('section_id')) {
            $query->whereHas('item.section', function ($q) use ($request) {
                $q->where('id', $request->input('section_id'));
            });
        }

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
                    case 'section.name':
                        $query->whereHas('item.section', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                    case 'weight':
                        $query->where('weight', 'like', "%{$searchTerm}%");
                        break;
                    case 'graded_at':
                        $query->whereDate('graded_at', $searchTerm);
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
                        ->orWhere('weight', 'like', "%{$searchTerm}%");
                });
            }
        }

        // Handle sorting
        if ($request->has('sort_column') && $request->filled('sort_column')) {
            $sortColumn = $request->input('sort_column');
            $sortDirection = $request->input('sort_direction', 'asc');

            switch ($sortColumn) {
                case 'party.name':
                    $query->join('parties', 'graded_items_pools.party_id', '=', 'parties.id')
                        ->orderBy('parties.name', $sortDirection);
                    break;
                case 'item.name':
                    $query->join('items', 'graded_items_pools.item_id', '=', 'items.id')
                        ->orderBy('items.name', $sortDirection);
                    break;
                case 'grade.name':
                    $query->join('grades', 'graded_items_pools.grade_id', '=', 'grades.id')
                        ->orderBy('grades.name', $sortDirection);
                    break;
                case 'weight':
                case 'graded_at':
                    $query->orderBy($sortColumn, $sortDirection);
                    break;
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        if ($request->has('page') && $request->filled('page')) {
            $perPage = $request->input('per_page', 10);
            $results = $query->paginate($perPage);
        } else {
            $results = $query->get();
        }

        return response()->json($results);
    }

    public function getGradedItemsPoolsForSelect(Request $request)
    {
        $query = GradedItemsPool::with('party', 'import');

        if ($request->has('party_id') && $request->filled('party_id')) {
            $query->where('party_id', $request->input('party_id'));
        }

        if ($request->has('import_id') && $request->filled('import_id')) {
            $query->where('import_id', $request->input('import_id'));
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
                    ->orWhere('barcode', 'like', "%{$searchTerm}%");
            });
        }

        $graded_items_pools = $query->get();
        return response()->json($graded_items_pools);
    }

    public function store(StoreGradedItemsPoolRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-items-pools-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $graded_items_pools = GradedItemsPool::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'GradedItemsPool created successfully.',
            'graded_items_pools' => $graded_items_pools
        ]);
    }


    public function update(UpdateGradedItemsPoolRequest $request, GradedItemsPool $graded_items_pool)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-items-pools-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $graded_items_pool->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'GradedItemsPool updated successfully.'
        ]);
    }

    public function destroy(GradedItemsPool $graded_items_pool)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-items-pools-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $graded_items_pool->delete();
        return response()->json([
            'success' => true,
            'message' => 'GradedItemsPool deleted successfully.'
        ]);
    }
}
