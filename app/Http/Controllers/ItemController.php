<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Permission;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ItemController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('items-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('Items/Index');
    }

    public function getItems(Request $request)
    {
        $query = Item::with('section', 'createdBy', 'updatedBy');
        if ($request->has('sort_column') && $request->filled('sort_column')) {
            $query->orderBy($request->input('sort_column'), $request->input('sort_direction'));
        }

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $searchColumn = $request->input('search_column');

            if ($searchColumn && $searchColumn !== 'all') {
                // Handle specific column search
                switch ($searchColumn) {
                    case 'name':
                    case 'description':
                        $query->where($searchColumn, 'like', "%{$searchTerm}%");
                        break;
                    case 'section':
                        $query->whereHas('section', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                }
            } else {
                // Handle global search across all searchable columns
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhereHas('section', function ($q) use ($searchTerm) {
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

    public function getItemsForSelect(Request $request){
        $query = Item::with('section', 'createdBy', 'updatedBy');

        if($request->has('section_id') && $request->filled('section_id')){
            $query->where('section_id', $request->input('section_id'));
        }

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhereHas('section', function ($q) use ($searchTerm) {
                      $q->where('name', 'like', "%{$searchTerm}%");
                  });

        }

        $items = $query->get();
        return response()->json($items);
    }

    public function store(StoreItemRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('items-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $item = Item::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Item created successfully.',
        ]);
    }

    public function update(UpdateItemRequest $request, Item $item)
    {
        $user = Auth::user();
        if (!$user->hasPermission('items-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $item->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully.'
        ]);
    }

    public function destroy(Item $item)
    {
        $user = Auth::user();
        if (!$user->hasPermission('items-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $item->delete();
        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully.'
        ]);
    }
}
