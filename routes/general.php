<?php

use App\Http\Controllers\General\AdminController;
use App\Http\Controllers\General\ProfileController;
use App\Http\Controllers\IrController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

$app_name = env('APP_NAME', '');

Route::redirect('/', "/$app_name");

Route::prefix($app_name)->middleware(AuthMiddleware::class)->group(function () {

  Route::middleware(AdminMiddleware::class)->group(function () {
    Route::get("/admin", [AdminController::class, 'index'])->name('admin');
    Route::get("/new-admin", [AdminController::class, 'index_addAdmin'])->name('index_addAdmin');
    Route::post("/add-admin", [AdminController::class, 'addAdmin'])->name('addAdmin');
    Route::post("/remove-admin", [AdminController::class, 'removeAdmin'])->name('removeAdmin');
    Route::patch("/change-admin-role", [AdminController::class, 'changeAdminRole'])->name('changeAdminRole');
  });

  Route::get("/", [DashboardController::class, 'index'])->name('dashboard');
  Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');
  Route::post("/change-password", [ProfileController::class, 'changePassword'])->name('changePassword');

  // Incident Report
  Route::get("/ir/create", [IrController::class, 'create'])->name('ir.create');
  Route::post("/ir/store", [IrController::class, 'store'])->name('ir.store');
  Route::get("/ir/employees/search", [IrController::class, 'searchEmployees'])->name('ir.searchEmployees');
  Route::get("/ir/employees/{employid}/work", [IrController::class, 'employeeWorkDetails'])->name('ir.employeeWorkDetails');
  Route::get("/ir/code-numbers", [IrController::class, 'codeNumbers'])->name('ir.codeNumbers');
});
