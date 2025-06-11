<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePartyRequest;
use App\Http\Requests\UpdatePartyRequest;
use App\Models\Permission;
use App\Models\Party;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PartyController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('parties-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('Parties/Index');
    }

    public function getParties(Request $request)
    {
        $query = Party::with('createdBy', 'updatedBy');
        if ($request->has('sort_column') && $request->filled('sort_column')) {
            $query->orderBy($request->input('sort_column'), $request->input('sort_direction'));
        }

        if ($request->has('type') && $request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $searchColumn = $request->input('search_column');

            if ($searchColumn && $searchColumn !== 'all') {
                // Handle specific column search
                switch ($searchColumn) {
                    case 'name':
                    case 'address_line_1':
                    case 'address_line_2':
                    case 'city':
                    case 'state':
                    case 'zip':
                    case 'country':
                    case 'phone':
                    case 'email':
                    case 'gst':
                        $query->where($searchColumn, 'like', "%{$searchTerm}%");
                        break;
                }
            } else {
                // Handle global search across all searchable columns
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                        ->orWhere('address_line_1', 'like', "%{$searchTerm}%")
                        ->orWhere('address_line_2', 'like', "%{$searchTerm}%")
                        ->orWhere('city', 'like', "%{$searchTerm}%")
                        ->orWhere('state', 'like', "%{$searchTerm}%")
                        ->orWhere('zip', 'like', "%{$searchTerm}%")
                        ->orWhere('country', 'like', "%{$searchTerm}%")
                        ->orWhere('phone', 'like', "%{$searchTerm}%")
                        ->orWhere('email', 'like', "%{$searchTerm}%")
                        ->orWhere('gst', 'like', "%{$searchTerm}%");
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

    public function getPartiesForSelect(Request $request)
    {
        $query = Party::with('createdBy', 'updatedBy');

        if ($request->has('type') && $request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where('name', 'like', "%{$searchTerm}%")
                ->orWhere('address_line_1', 'like', "%{$searchTerm}%")
                ->orWhere('address_line_2', 'like', "%{$searchTerm}%")
                ->orWhere('city', 'like', "%{$searchTerm}%")
                ->orWhere('state', 'like', "%{$searchTerm}%")
                ->orWhere('zip', 'like', "%{$searchTerm}%")
                ->orWhere('country', 'like', "%{$searchTerm}%")
                ->orWhere('phone', 'like', "%{$searchTerm}%")
                ->orWhere('email', 'like', "%{$searchTerm}%")
                ->orWhere('gst', 'like', "%{$searchTerm}%");
        }

        $parties = $query->get();
        return response()->json($parties);
    }

    public function store(StorePartyRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('parties-create')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $party = Party::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Party created successfully.',
        ]);
    }

    public function update(UpdatePartyRequest $request, Party $party)
    {
        $user = Auth::user();
        if (!$user->hasPermission('parties-update')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }

        $party->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Party updated successfully.'
        ]);
    }

    public function destroy(Party $party)
    {
        $user = Auth::user();
        if (!$user->hasPermission('parties-delete')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        $party->delete();
        return response()->json([
            'success' => true,
            'message' => 'Party deleted successfully.'
        ]);
    }
}
