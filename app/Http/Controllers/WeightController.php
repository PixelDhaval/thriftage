<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWeightRequest;
use App\Http\Requests\UpdateWeightRequest;
use App\Models\Permission;
use App\Models\Weight;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WeightController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('weights-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('Weights/Index');
    }

    public function getWeights(Request $request)
    {
        $query = Weight::with('createdBy', 'updatedBy');
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

    public function getWeightsForSelect(Request $request){
        $query = Weight::with('createdBy', 'updatedBy');

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

        $weights = $query->get();
        return response()->json($weights);
    }

    public function store(StoreWeightRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('weights-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $weight = Weight::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Weight created successfully.',
        ]);
    }

    public function update(UpdateWeightRequest $request, Weight $weight)
    {
        $user = Auth::user();
        if (!$user->hasPermission('weights-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $weight->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Weight updated successfully.'
        ]);
    }

    public function destroy(Weight $weight)
    {
        $user = Auth::user();
        if (!$user->hasPermission('weights-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $weight->delete();
        return response()->json([
            'success' => true,
            'message' => 'Weight deleted successfully.'
        ]);
    }
}
