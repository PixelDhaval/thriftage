<?php

namespace App\Http\Controllers;

use App\Models\GradedBagsPool;
use App\Models\Item;
use App\Models\Section;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProductionReportExport;

class ReportController extends Controller
{
    /**
     * Display the reports index page.
     */
    public function index()
    {
        $user = Auth::user();
        if (!$user->hasPermission('reports-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view reports.');
        }
        
        return Inertia::render('Reports/Index');
    }

    /**
     * Generate production report data
     */
    public function productionReport(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('reports-read')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if export is requested
        if ($request->has('export') && $request->export === 'excel') {
            return $this->exportProductionReport($request);
        }

        // Validate request params
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
            'section_id' => 'nullable|exists:sections,id',
            'grade_id' => 'nullable|exists:grades,id',
        ]);

        // Build query for production report
        $query = GradedBagsPool::query()
            ->with(['item.section', 'grade', 'weight'])
            ->select([
                'graded_bags_pools.item_id',
                'graded_bags_pools.grade_id', 
                'graded_bags_pools.weight_id',
                DB::raw('COUNT(*) as total_bags'),
                DB::raw('SUM(CASE WHEN weights.weight_type = "pair" THEN graded_bags_pools.weight ELSE weights.weight END) as total_weight')
            ])
            ->join('weights', 'graded_bags_pools.weight_id', '=', 'weights.id')
            ->groupBy('graded_bags_pools.item_id', 'graded_bags_pools.grade_id', 'graded_bags_pools.weight_id');

        // Apply date filters
        if ($request->filled('from_date')) {
            $query->whereDate('graded_bags_pools.created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('graded_bags_pools.created_at', '<=', $request->to_date);
        }

        // Apply section filter
        if ($request->filled('section_id')) {
            $query->whereHas('item', function ($q) use ($request) {
                $q->where('section_id', $request->section_id);
            });
        }

        // Apply grade filter
        if ($request->filled('grade_id')) {
            $query->where('graded_bags_pools.grade_id', $request->grade_id);
        }

        // Handle search if provided
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $searchColumn = $request->search_column;

            if ($searchColumn && $searchColumn !== 'all') {
                switch ($searchColumn) {
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
                    case 'item.section.name':
                        $query->whereHas('item.section', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                }
            } else {
                // Global search
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereHas('item', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('grade', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('item.section', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    });
                });
            }
        }

        // Apply sorting
        if ($request->filled('sort_column')) {
            $sortColumn = $request->sort_column;
            $sortDirection = $request->sort_direction ?? 'asc';

            switch ($sortColumn) {
                case 'item.name':
                    $query->join('items', 'graded_bags_pools.item_id', '=', 'items.id')
                          ->orderBy('items.name', $sortDirection);
                    break;
                case 'grade.name':
                    $query->join('grades', 'graded_bags_pools.grade_id', '=', 'grades.id')
                          ->orderBy('grades.name', $sortDirection);
                    break;
                case 'item.section.name':
                    $query->join('items as section_items', 'graded_bags_pools.item_id', '=', 'section_items.id')
                          ->join('sections', 'section_items.section_id', '=', 'sections.id')
                          ->orderBy('sections.name', $sortDirection);
                    break;
                case 'total_bags':
                    $query->orderBy('total_bags', $sortDirection);
                    break;
                case 'total_weight':
                    $query->orderBy('total_weight', $sortDirection);
                    break;
                default:
                    // Default to ordering by item name
                    $query->join('items as default_items', 'graded_bags_pools.item_id', '=', 'default_items.id')
                          ->orderBy('default_items.name', 'asc');
                    break;
            }
        } else {
            // Set default ordering to item name
            $query->join('items as default_items', 'graded_bags_pools.item_id', '=', 'default_items.id')
                  ->orderBy('default_items.name', 'asc');
        }

        // Apply pagination or return all results
        if ($request->filled('per_page') && $request->per_page > 0) {
            $perPage = $request->per_page ?? 20;
            $results = $query->paginate($perPage);
        } else {
            $results = $query->get();
        }

        // Load relationships
        if (isset($results->items)) {
            foreach ($results->items() as $result) {
                $result->item = $result->item;
                $result->grade = $result->grade;
                $result->weight = $result->weight;
            }
        } else {
            foreach ($results as $result) {
                $result->item = $result->item;
                $result->grade = $result->grade;
                $result->weight = $result->weight;
            }
        }

        // Calculate summary statistics
        $summary = [
            'total_records' => $results instanceof \Illuminate\Pagination\LengthAwarePaginator ? $results->total() : count($results),
            'total_bags' => $results->sum('total_bags'),
            'total_weight' => $results->sum('total_weight'),
        ];

        // Return with summary included
        if ($results instanceof \Illuminate\Pagination\LengthAwarePaginator) {
            // For paginated results, add summary as additional data
            $responseData = $results->toArray();
            $responseData['summary'] = $summary;
            return response()->json($responseData);
        } else {
            // For collection results, wrap in a response with summary
            return response()->json([
                'data' => $results,
                'summary' => $summary
            ]);
        }
    }

    /**
     * Export production report to Excel
     */
    protected function exportProductionReport(Request $request)
    {
        // Build query for production report (same as in productionReport method)
        $query = GradedBagsPool::query()
            ->with(['item.section', 'grade', 'weight'])
            ->select([
                'graded_bags_pools.item_id',
                'graded_bags_pools.grade_id', 
                'graded_bags_pools.weight_id',
                DB::raw('COUNT(*) as total_bags'),
                DB::raw('SUM(CASE WHEN weights.weight_type = "pair" THEN graded_bags_pools.weight ELSE weights.weight END) as total_weight')
            ])
            ->join('weights', 'graded_bags_pools.weight_id', '=', 'weights.id')
            ->join('items as default_items', 'graded_bags_pools.item_id', '=', 'default_items.id')
            ->groupBy('graded_bags_pools.item_id', 'graded_bags_pools.grade_id', 'graded_bags_pools.weight_id')
            ->orderBy('default_items.name', 'asc');

        // Apply date filters
        if ($request->filled('from_date')) {
            $query->whereDate('graded_bags_pools.created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('graded_bags_pools.created_at', '<=', $request->to_date);
        }

        // Apply section filter
        if ($request->filled('section_id')) {
            $query->whereHas('item', function ($q) use ($request) {
                $q->where('section_id', $request->section_id);
            });
        }

        // Apply grade filter
        if ($request->filled('grade_id')) {
            $query->where('graded_bags_pools.grade_id', $request->grade_id);
        }

        // Get all results for export
        $data = $query->get();
        
        // Get section and grade names for the file name
        $sectionName = 'All';
        $gradeName = 'All';
        
        if ($request->filled('section_id')) {
            $section = Section::find($request->section_id);
            if ($section) {
                $sectionName = str_replace(' ', '_', $section->name);
            }
        }
        
        if ($request->filled('grade_id')) {
            $grade = Grade::find($request->grade_id);
            if ($grade) {
                $gradeName = str_replace(' ', '_', $grade->name);
            }
        }
        
        // Generate file name with date range, section, and grade
        $fromDate = $request->filled('from_date') ? date('Y-m-d', strtotime($request->from_date)) : date('Y-m-d');
        $toDate = $request->filled('to_date') ? date('Y-m-d', strtotime($request->to_date)) : date('Y-m-d');
        
        $fileName = "Production_Report_{$sectionName}_{$gradeName}_{$fromDate}_to_{$toDate}.xlsx";
        
        // Return Excel download with the data
        return Excel::download(
            new ProductionReportExport($data), 
            $fileName
        );
    }

    /**
     * Generate section-wise grading report data
     */
    public function gradingReport(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermission('reports-read')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if export is requested
        if ($request->has('export') && $request->export === 'excel') {
            return $this->exportGradingReport($request);
        }

        // Validate request params
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
            'section_id' => 'nullable|exists:sections,id',
            'grade_id' => 'nullable|exists:grades,id',
        ]);

        // Build query for grading report
        $query = \App\Models\GradedItemsPool::query()
            ->with(['section', 'grade', 'party'])
            ->select([
                'section_id',
                'grade_id', 
                DB::raw('SUM(weight) as total_weight'),
                DB::raw('SUM(pair) as total_pairs'),
            ])
            ->groupBy('section_id', 'grade_id');

        // Apply date filters
        if ($request->filled('from_date')) {
            $query->whereDate('graded_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('graded_at', '<=', $request->to_date);
        }

        // Apply section filter
        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        // Apply grade filter
        if ($request->filled('grade_id')) {
            $query->where('grade_id', $request->grade_id);
        }

        // Handle search if provided
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $searchColumn = $request->search_column;

            if ($searchColumn && $searchColumn !== 'all') {
                switch ($searchColumn) {
                    case 'section.name':
                        $query->whereHas('section', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                    case 'grade.name':
                        $query->whereHas('grade', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                    case 'party.name':
                        $query->whereHas('party', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%");
                        });
                        break;
                }
            } else {
                // Global search
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereHas('section', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('grade', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('party', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    });
                });
            }
        }

        // Apply sorting
        if ($request->filled('sort_column')) {
            $sortColumn = $request->sort_column;
            $sortDirection = $request->sort_direction ?? 'asc';

            switch ($sortColumn) {
                case 'section.name':
                    $query->join('sections', 'graded_items_pools.section_id', '=', 'sections.id')
                          ->orderBy('sections.name', $sortDirection);
                    break;
                case 'grade.name':
                    $query->join('grades', 'graded_items_pools.grade_id', '=', 'grades.id')
                          ->orderBy('grades.name', $sortDirection);
                    break;
                case 'total_weight':
                    $query->orderBy('total_weight', $sortDirection);
                    break;
                case 'total_pairs':
                    $query->orderBy('total_pairs', $sortDirection);
                    break;
                default:
                    $query->join('sections', 'graded_items_pools.section_id', '=', 'sections.id')
                          ->orderBy('sections.name', 'asc');
                    break;
            }
        } else {
            // Default sort by section name
            $query->join('sections', 'graded_items_pools.section_id', '=', 'sections.id')
                  ->orderBy('sections.name', 'asc');
        }

        // Apply pagination or return all results
        if ($request->filled('per_page') && $request->per_page > 0) {
            $perPage = $request->per_page ?? 20;
            $results = $query->paginate($perPage);
        } else {
            $results = $query->get();
        }

        // Load relationships
        if (isset($results->items)) {
            foreach ($results->items() as $result) {
                $result->section = $result->section;
                $result->grade = $result->grade;
            }
        } else {
            foreach ($results as $result) {
                $result->section = $result->section;
                $result->grade = $result->grade;
            }
        }

        // Calculate summary statistics
        $summary = [
            'total_records' => $results instanceof \Illuminate\Pagination\LengthAwarePaginator ? $results->total() : count($results),
            'total_weight' => $results->sum('total_weight'),
            'total_pairs' => $results->sum('total_pairs'),
        ];

        // Return with summary included
        if ($results instanceof \Illuminate\Pagination\LengthAwarePaginator) {
            // For paginated results, add summary as additional data
            $responseData = $results->toArray();
            $responseData['summary'] = $summary;
            return response()->json($responseData);
        } else {
            // For collection results, wrap in a response with summary
            return response()->json([
                'data' => $results,
                'summary' => $summary
            ]);
        }
    }

    /**
     * Export grading report to Excel
     */
    protected function exportGradingReport(Request $request)
    {
        // Similar query as gradingReport but without pagination
        $query = \App\Models\GradedItemsPool::query()
            ->with(['section', 'grade', 'party'])
            ->select([
                'section_id',
                'grade_id', 
                DB::raw('SUM(weight) as total_weight'),
                DB::raw('SUM(pair) as total_pairs'),
            ])
            ->groupBy('section_id', 'grade_id')
            ->join('sections', 'graded_items_pools.section_id', '=', 'sections.id')
            ->orderBy('sections.name', 'asc');

        // Apply date filters
        if ($request->filled('from_date')) {
            $query->whereDate('graded_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('graded_at', '<=', $request->to_date);
        }

        // Apply section filter
        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        // Apply grade filter
        if ($request->filled('grade_id')) {
            $query->where('grade_id', $request->grade_id);
        }

        // Get all results for export
        $data = $query->get();
        
        // Get section and grade names for the file name
        $sectionName = 'All';
        $gradeName = 'All';
        
        if ($request->filled('section_id')) {
            $section = Section::find($request->section_id);
            if ($section) {
                $sectionName = str_replace(' ', '_', $section->name);
            }
        }
        
        if ($request->filled('grade_id')) {
            $grade = Grade::find($request->grade_id);
            if ($grade) {
                $gradeName = str_replace(' ', '_', $grade->name);
            }
        }
        
        // Generate file name with date range, section, and grade
        $fromDate = $request->filled('from_date') ? date('Y-m-d', strtotime($request->from_date)) : date('Y-m-d');
        $toDate = $request->filled('to_date') ? date('Y-m-d', strtotime($request->to_date)) : date('Y-m-d');
        
        $fileName = "Grading_Report_{$sectionName}_{$gradeName}_{$fromDate}_to_{$toDate}.xlsx";
        
        // Return Excel download with the data
        return Excel::download(
            new \App\Exports\GradingReportExport($data), 
            $fileName
        );
    }
}
