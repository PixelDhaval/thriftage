<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGradeRequest;
use App\Http\Requests\UpdateGradeRequest;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GradeController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('grades-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('Grades/Index');
    }

    public function getGrades(Request $request)
    {
        $query = Grade::with('createdBy', 'updatedBy');
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
                        $query->where($searchColumn, 'like', "%{$searchTerm}%");
                        break;
                }
            } else {
                // Handle global search across all searchable columns
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%");
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

    public function getGradesForSelect(Request $request){
        $query = Grade::with('createdBy', 'updatedBy');

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where('name', 'like', "%{$searchTerm}%");

        }

        $grades = $query->get();
        return response()->json($grades);
    }

    public function store(StoreGradeRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('grades-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $grade = Grade::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Grade created successfully.',
        ]);
    }

    public function update(UpdateGradeRequest $request, Grade $grade)
    {
        $user = Auth::user();
        if (!$user->hasPermission('grades-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $grade->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Grade updated successfully.'
        ]);
    }

    public function destroy(Grade $grade)
    {
        $user = Auth::user();
        if (!$user->hasPermission('grades-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $grade->delete();
        return response()->json([
            'success' => true,
            'message' => 'Grade deleted successfully.'
        ]);
    }
}
