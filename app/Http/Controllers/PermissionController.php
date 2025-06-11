<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PermissionController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('permissions-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $permissions = Permission::all();
        return Inertia::render('Permissions/Index', ['permissions' => $permissions]);
    }

    public function getPermissions(Request $request)
    {
        $query = Permission::query();
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
                    case 'display_name':
                        $query->where($searchColumn, 'like', "%{$searchTerm}%");
                        break;
                }
            } else {
                // Handle global search across all searchable columns
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                        ->orWhere('display_name', 'like', "%{$searchTerm}%");
                });
            }
        }

        $perPage = $request->input('per_page', 10);
        $users = $query->paginate($perPage);

        return response()->json($users);
    }


    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('permissions-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $request->validate([
            'name' => 'required|unique:permissions',
            'display_name' => 'required',
        ]);

        Permission::create($request->only('name', 'display_name'));
        return response()->json([
            'success' => true,
            'message' => 'Permission created successfully.',
        ]);
    }


    public function update(Request $request, Permission $permission)
    {
        $user = Auth::user();
        if (!$user->hasPermission('permissions-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $request->validate([
            'display_name' => 'required',
        ]);

        $permission->update($request->only('display_name'));

        return response()->json([
            'success' => true,
            'message' => 'Permission updated successfully.',
        ]);
    }

    public function destroy(Permission $permission)
    {
        $user = Auth::user();
        if (!$user->hasPermission('permissions-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $permission->delete();
        return response()->json([
            'success' => true,
            'message' => 'Permission deleted successfully.',
        ]);
    }
}
