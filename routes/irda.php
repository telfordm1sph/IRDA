<?php

use App\Http\Controllers\IrController;
use App\Http\Controllers\IrMaintenanceController;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;


$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

    // Incident Report
    Route::get("/ir", [IrController::class, 'index'])->name('ir.index');
    Route::get("/ir/staff", [IrController::class, 'staff'])->name('ir.staff');
    Route::get("/ir/admin", [IrController::class, 'adminList'])->name('ir.admin');
    Route::get("/ir/create", [IrController::class, 'create'])->name('ir.create');
    Route::post("/ir/store", [IrController::class, 'store'])->name('ir.store');
    Route::get("/ir/employees/search", [IrController::class, 'searchEmployees'])->name('ir.searchEmployees');
    Route::get("/ir/employees/{employid}/work", [IrController::class, 'employeeWorkDetails'])->name('ir.employeeWorkDetails');
    Route::get("/ir/code-numbers", [IrController::class, 'codeNumbers'])->name('ir.codeNumbers');
    Route::get("/ir/{hash}/da", [IrController::class, 'showDa'])->name('ir.show.da');
    // Bulk action — must be before {hash} routes
    Route::post("/ir/bulk-action",        [IrController::class, 'bulkAction'])->name('ir.bulkAction');
    // IR process actions — must come before the catch-all
    Route::get("/ir/{hash}/edit",         [IrController::class, 'edit'])->name('ir.edit');
    Route::post("/ir/{hash}/resubmit",    [IrController::class, 'resubmit'])->name('ir.resubmit');
    Route::post("/ir/{hash}/validate",    [IrController::class, 'validateIr'])->name('ir.validate');
    Route::post("/ir/{hash}/loe",         [IrController::class, 'submitLoe'])->name('ir.submitLoe');
    Route::post("/ir/{hash}/assess",      [IrController::class, 'supervisorAssess'])->name('ir.assess');
    Route::post("/ir/{hash}/dept-review", [IrController::class, 'deptHeadReview'])->name('ir.deptReview');
    Route::post("/ir/{hash}/revalidate",  [IrController::class, 'hrRevalidate'])->name('ir.revalidate');
    Route::post("/ir/{hash}/issue-da",    [IrController::class, 'issueDa'])->name('ir.issueDa');
    Route::post("/ir/{hash}/da/hr-approve",  [IrController::class, 'hrManagerApprove'])->name('ir.da.hrApprove');
    Route::post("/ir/{hash}/da/sv-ack",      [IrController::class, 'svAcknowledge'])->name('ir.da.svAck');
    Route::post("/ir/{hash}/da/dm-ack",      [IrController::class, 'dmAcknowledge'])->name('ir.da.dmAck');
    Route::post("/ir/{hash}/da/acknowledge", [IrController::class, 'employeeAcknowledge'])->name('ir.da.acknowledge');
    // ── Maintenance (HR only) ──────────────────────────────────────────────────
    Route::prefix('/ir/maintenance')->name('ir.maintenance.')->group(function () {
        // IR Admin management
        Route::get('/admins',                   [IrMaintenanceController::class, 'admins'])->name('admins');
        Route::post('/admins',                  [IrMaintenanceController::class, 'adminStore'])->name('admins.store');
        Route::put('/admins/{id}',              [IrMaintenanceController::class, 'adminUpdate'])->name('admins.update');
        Route::post('/admins/{id}/toggle',      [IrMaintenanceController::class, 'adminToggle'])->name('admins.toggle');
        Route::delete('/admins/{id}',           [IrMaintenanceController::class, 'adminDelete'])->name('admins.delete');

        // Code number management
        Route::get('/codes',                    [IrMaintenanceController::class, 'codes'])->name('codes');
        Route::post('/codes',                   [IrMaintenanceController::class, 'codeStore'])->name('codes.store');
        Route::put('/codes/{id}',               [IrMaintenanceController::class, 'codeUpdate'])->name('codes.update');
        Route::post('/codes/{id}/toggle',       [IrMaintenanceController::class, 'codeToggle'])->name('codes.toggle');
    });

    // Must be last — catch-all hash segment
    Route::get("/ir/{hash}", [IrController::class, 'show'])->name('ir.show');
});
