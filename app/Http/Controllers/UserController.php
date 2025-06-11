<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laratrust\Laratrust;

class UserController extends Controller
{
    // Display a listing of users
    public function index()
    {
        $user = Auth::user();
        if(!$user->hasPermission('users-read')){
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $users = User::with('roles', 'permissions')->get();
        $roles = Role::all();
        $permissions = Permission::all();
        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    // API endpoint for DataTable
    public function getUsers(Request $request)
    {
        $query = User::with('roles', 'permissions');
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
                    case 'email':
                        $query->where($searchColumn, 'like', "%{$searchTerm}%");
                        break;
                    case 'roles':
                        $query->whereHas('roles', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%")
                              ->orWhere('display_name', 'like', "%{$searchTerm}%");
                        });
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
                      ->orWhereHas('roles', function ($q) use ($searchTerm) {
                          $q->where('name', 'like', "%{$searchTerm}%")
                            ->orWhere('display_name', 'like', "%{$searchTerm}%");
                      })
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

    // Show the form for creating a new user
    public function create()
    {
        $user = Auth::user();
        if(!$user->hasPermission('users-update')){
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $roles = Role::all();
        $permissions = Permission::all();
        return Inertia::render('Users/Create', compact('roles', 'permissions'));
    }

    // Store a newly created user in storage
    public function store(Request $request)
    {
        $user = Auth::user();
        if(!$user->hasPermission('users-create')){
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'array',
            'permissions' => 'array',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        $user->syncRoles($validated['roles'] ?? []);
        $user->syncPermissions($validated['permissions'] ?? []);

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user,
        ]);
    }

    // Show the form for editing the specified user
    public function edit(User $user)
    {
        $logged_user = Auth::user();
        if(!$logged_user->hasPermission('users-update')){
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $roles = Role::all();
        $permissions = Permission::all();
        $user->load('roles', 'permissions');

        return Inertia::render('Users/Edit', compact('user', 'roles', 'permissions'));
    }

    // Update the specified user in storage
    public function update(Request $request, User $user)
    {
        $logged_user = Auth::user();
        if(!$logged_user->hasPermission('users-update')){
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'array',
            'permissions' => 'array',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'] ? bcrypt($validated['password']) : $user->password,
        ]);

        $user->syncRoles($validated['roles'] ?? []);
        $user->syncPermissions($validated['permissions'] ?? []);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user,
        ]);
    }

    // Remove the specified user from storage
    public function destroy(User $user)
    {
        $logged_user = Auth::user();
        if(!$logged_user->hasPermission('users-delete')){
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $user->delete();
        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
}
