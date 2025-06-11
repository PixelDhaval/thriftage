<?php
namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('roles-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $permissions = Permission::all();
        return Inertia::render('Roles/Index', ['permissions' => $permissions]);
    }

    public function getRoles(Request $request)
    {
        $query = Role::with('permissions');
        if($request->has('sort_column') && $request->filled('sort_column')){
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
                    case 'permissions':
                        $query->whereHas('permissions', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%")
                              ->orWhere('display_name', 'like', "%{$searchTerm}%");
                        });
                        break;
                }
            } else {
                // Handle global search across all searchable columns
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%")
                      ->orWhereHas('permissions', function ($q) use ($searchTerm) {
                          $q->where('name', 'like', "%{$searchTerm}%")
                            ->orWhere('display_name', 'like', "%{$searchTerm}%");
                      });
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
        if (!$user->hasPermission('roles-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $request->validate([
            'name' => 'required|unique:roles',
            'display_name' => 'required',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create($request->only('name', 'display_name'));
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }
        return response()->json([
            'success' => true,
            'message' => 'Role created successfully.',
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $user = Auth::user();
        if (!$user->hasPermission('roles-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $request->validate([
            'display_name' => 'required',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        } 

        $role->update($request->only('display_name'));

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully.'
        ]);
    }

    public function destroy(Role $role)
    {
        $user = Auth::user();
        if (!$user->hasPermission('roles-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $role->delete();
        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully.'
        ]);
    }
}
