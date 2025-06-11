<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSectionRequest;
use App\Http\Requests\UpdateSectionRequest;
use App\Models\Permission;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SectionController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('sections-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('Sections/Index');
    }

    public function getSections(Request $request)
    {
        $query = Section::query();
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

    public function getSectionsForSelect(Request $request){
        $query = Section::query();

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where('name', 'like', "%{$searchTerm}%");
        }

        $companies = $query->get();
        return response()->json($companies);
    }

    public function store(StoreSectionRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('sections-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $section = Section::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Section created successfully.',
        ]);
    }

    public function update(UpdateSectionRequest $request, Section $section)
    {
        $user = Auth::user();
        if (!$user->hasPermission('sections-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $section->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Section updated successfully.'
        ]);
    }

    public function destroy(Section $section)
    {
        $user = Auth::user();
        if (!$user->hasPermission('sections-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $section->delete();
        return response()->json([
            'success' => true,
            'message' => 'Section deleted successfully.'
        ]);
    }
}
