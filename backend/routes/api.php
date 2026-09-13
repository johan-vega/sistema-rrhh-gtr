<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HrController;
use App\Http\Controllers\HrProfileController;
use App\Http\Controllers\LaborRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::get('categories', [LaborRequestController::class, 'categories']);
    Route::get('categories/{category}', [LaborRequestController::class, 'category']);
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'read']);
    Route::middleware('worker')->group(function () {
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::get('requests', [LaborRequestController::class, 'index']);
        Route::post('requests', [LaborRequestController::class, 'store']);
        Route::get('requests/{request}', [LaborRequestController::class, 'show']);
        Route::post('requests/{request}/cancel', [LaborRequestController::class, 'cancel']);
        Route::get('requests/{request}/documents/{document}', [LaborRequestController::class, 'download']);
        Route::get('calendar', [LaborRequestController::class, 'calendar']);
    });
    Route::prefix('hr')->middleware('hr')->group(function () {
        Route::get('profile', [HrProfileController::class, 'show']);
        Route::put('profile', [HrProfileController::class, 'update']);
        Route::get('dashboard', [HrController::class, 'dashboard']);
        Route::get('workers', [HrController::class, 'workers']);
        Route::post('workers', [HrController::class, 'storeWorker']);
        Route::get('workers/{worker}', [HrController::class, 'showWorker']);
        Route::put('workers/{worker}', [HrController::class, 'updateWorker']);
        Route::patch('workers/{worker}/status', [HrController::class, 'workerStatus']);
        Route::get('areas', [HrController::class, 'areas']);
        Route::post('areas', [HrController::class, 'storeArea']);
        Route::put('areas/{area}', [HrController::class, 'updateArea']);
        Route::patch('areas/{area}/status', [HrController::class, 'areaStatus']);
        Route::get('positions', [HrController::class, 'positions']);
        Route::post('positions', [HrController::class, 'storePosition']);
        Route::put('positions/{position}', [HrController::class, 'updatePosition']);
        Route::patch('positions/{position}/status', [HrController::class, 'positionStatus']);
        Route::get('categories', [HrController::class, 'categories']);
        Route::post('categories', [HrController::class, 'storeCategory']);
        Route::get('categories/{category}', [HrController::class, 'showCategory']);
        Route::put('categories/{category}', [HrController::class, 'updateCategory']);
        Route::patch('categories/{category}/status', [HrController::class, 'categoryStatus']);
        Route::get('requests', [HrController::class, 'requests']);
        Route::get('requests/{request}', [HrController::class, 'showRequest']);
        Route::get('requests/{request}/documents/{document}', [LaborRequestController::class, 'download']);
        Route::post('requests/{request}/approve', [HrController::class, 'approve']);
        Route::post('requests/{request}/reject', [HrController::class, 'reject']);
        Route::post('requests/{request}/cancel', [HrController::class, 'cancelRequest']);
        Route::get('calendar', [HrController::class, 'calendar']);
        Route::get('reports/requests', [HrController::class, 'report']);
        Route::get('reports/requests/export', [HrController::class, 'exportReport']);
        Route::get('analytics/requests', [HrController::class, 'requestAnalytics']);
        Route::get('notifications', [NotificationController::class, 'index']);
    });
});
