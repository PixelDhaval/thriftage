<?php

namespace App\Http\Controllers;

use App\Models\GradedStock;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GradedStockController extends Controller
{
    public function getAvailableStock(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-bags-pools-read')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = GradedStock::with(['section', 'grade']);

        // Filter by item_id
        if ($request->has('section_id') && $request->filled('section_id')) {
            $query->where('section_id', $request->input('section_id'));
        }

        // Filter by grade_id
        if ($request->has('grade_id') && $request->filled('grade_id')) {
            $query->where('grade_id', $request->input('grade_id'));
        }

        // Only show items with weight > 0
        $query->where('weight', '>', 0);

        $stocks = $query->get();

        return response()->json($stocks);
    }

    public function checkAvailability(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('graded-bags-pools-read')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'item_id' => 'required|exists:items,id',
            'grade_id' => 'required|exists:grades,id',
            'required_weight' => 'required|numeric|min:0.01'
        ]);

        $section = Item::find($request->input('item_id'))->section;

        $stock = GradedStock::where('section_id', $section->id)
            ->where('grade_id', $request->input('grade_id'))
            ->first();

        $availableWeight = $stock ? $stock->weight : 0;
        $requiredWeight = $request->input('required_weight');

        return response()->json([
            'available_weight' => $availableWeight,
            'required_weight' => $requiredWeight,
            'is_sufficient' => $availableWeight >= $requiredWeight,
            'shortage' => $availableWeight < $requiredWeight ? ($requiredWeight - $availableWeight) : 0
        ]);
    }
}
