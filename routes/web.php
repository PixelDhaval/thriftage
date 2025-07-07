<?php

use App\Http\Controllers\GradeController;
use App\Http\Controllers\GradedBagsPoolController;
use App\Http\Controllers\GradedItemsPoolController;
use App\Http\Controllers\ImportBagController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PartyController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\UserRolePermissionController;
use App\Http\Controllers\WeightController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\GradedStockController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Users Management
    Route::resource('users', UserController::class);

    // Roles Management
    Route::resource('roles', RoleController::class);

    // Permissions Management
    Route::resource('permissions', PermissionController::class);

    // User Role & Permission Assignment
    Route::get('users/{user}/roles-permissions', [UserRolePermissionController::class, 'edit'])->name('users.roles-permissions.edit');
    Route::put('users/{user}/roles-permissions', [UserRolePermissionController::class, 'update'])->name('users.roles-permissions.update');

    Route::get('/api/users', [UserController::class, 'getUsers'])->name('api.users.index');
    Route::get('/api/roles', [RoleController::class, 'getRoles'])->name('api.roles.index');
    Route::get('/api/permissions', [PermissionController::class, 'getPermissions'])->name('api.permissions.index');
    Route::get('/api/users/select', [UserController::class, 'getUsersForSelect'])->name('api.users.select');

    Route::resource('sections', SectionController::class);
    Route::get('/api/sections', [SectionController::class, 'getSections'])->name('api.sections.index');
    Route::get('/api/sections/select', [SectionController::class, 'getSectionsForSelect'])->name('api.sections.select');

    Route::resource('items', ItemController::class);
    Route::get('/api/items', [ItemController::class, 'getItems'])->name('api.items.index');
    Route::get('/api/items/select', [ItemController::class, 'getItemsForSelect'])->name('api.items.select');

    Route::resource('grades', GradeController::class);
    Route::get('/api/grades', [GradeController::class, 'getGrades'])->name('api.grades.index');
    Route::get('/api/grades/select', [GradeController::class, 'getGradesForSelect'])->name('api.grades.select');

    Route::resource('weights', WeightController::class);
    Route::get('/api/weights', [WeightController::class, 'getWeights'])->name('api.weights.index');
    Route::get('/api/weights/select', [WeightController::class, 'getWeightsForSelect'])->name('api.weights.select');

    Route::resource('parties', PartyController::class);
    Route::get('/api/parties', [PartyController::class, 'getParties'])->name('api.parties.index');
    Route::get('/api/parties/select', [PartyController::class, 'getPartiesForSelect'])->name('api.parties.select');

    Route::resource('imports', ImportController::class);
    Route::get('/api/imports', [ImportController::class, 'getImports'])->name('api.imports.index');
    Route::get('/api/imports/select', [ImportController::class, 'getImportsForSelect'])->name('api.imports.select');

    Route::resource('import-bags', ImportBagController::class);
    Route::get('/api/import-bags', [ImportBagController::class, 'getImportBags'])->name('api.import-bags.index');
    Route::get('/api/import-bags/select', [ImportBagController::class, 'getImportBagsForSelect'])->name('api.import-bags.select');
    Route::post('/import-bags/batch', [ImportBagController::class, 'storeBatch'])->name('import-bags.batch');

    Route::get('/api/import-bags-with-barcodes', [ImportBagController::class, 'getImportBagsWithBarcodes'])->name('api.import-bags-with-barcodes.index');


    Route::get('/bags-opening', function () {
        $user = Auth::user();
        if (!$user->hasPermission('bags-opening-read')) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to view this page.');
        }
        return Inertia::render('BagsOpening/Index');
    })->name('bags-opening.index');

    Route::post('/api/import-bags/scan', [ImportBagController::class, 'updateByBarcode']);
    Route::post('/api/import-bags/toggle-status', [ImportBagController::class, 'toggleStatusByBarcode']);

    Route::resource('graded-bags-pools', GradedBagsPoolController::class);
    Route::get('/api/graded-bags-pools', [GradedBagsPoolController::class, 'getGradedBagsPools'])->name('api.graded-bags-pools.index');
    Route::get('/api/graded-bags-pools/select', [GradedBagsPoolController::class, 'getGradedBagsPoolsForSelect'])->name('api.graded-bags-pools.select');
    Route::get('/api/graded-bags-pools-with-barcodes', [GradedBagsPoolController::class, 'getGradedBagsPoolsWithBarcodes']);
    Route::post('/api/graded-bags-pools/batch', [GradedBagsPoolController::class, 'storeBatch'])->name('graded-bags-pools.batch');

    // Import routes
    Route::get('/api/imports/{import}/stats', [ImportController::class, 'getImportStats'])->name('imports.stats');
    Route::get('/api/imports/{import}/available-opened-goods', [ImportController::class, 'getAvailableOpenedGoods'])->name('imports.available-opened-goods');

    Route::resource('graded-items-pools', GradedItemsPoolController::class);
    Route::get('/api/graded-items-pools', [GradedItemsPoolController::class, 'getGradedItemsPools'])->name('api.graded-items-pools.index');
    Route::get('/api/graded-items-pools/select', [GradedItemsPoolController::class, 'getGradedItemsPoolsForSelect'])->name('api.graded-items-pools.select');

    Route::get('/api/graded-stock/available', [GradedStockController::class, 'getAvailableStock']);
    Route::post('/api/graded-stock/check-availability', [GradedStockController::class, 'checkAvailability']);

    // Dashboard data endpoint
    Route::get('/api/dashboard', [DashboardController::class, 'getDashboardData']);

});


// Reports Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/reports', [App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
    
    // API Routes for Reports
    Route::prefix('api/reports')->group(function () {
        Route::get('/production', [App\Http\Controllers\ReportController::class, 'productionReport']);
        Route::get('/grading', [App\Http\Controllers\ReportController::class, 'gradingReport']); // New route for grading report
    });
});


// API routes for DataTable

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
