<?php

use App\Http\Controllers\Admin\InquiryController;
use App\Http\Controllers\Admin\LocationController;
use App\Http\Controllers\Admin\LookupController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ForcePasswordChangeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\PropertyInquiryController;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyInquiry;
use App\Models\PropertyType;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $availableStatusIds = \App\Models\PropertyStatus::whereIn('slug', ['unsold', 'available_for_rent'])->pluck('id');

    $featuredProperties = Property::with(['location', 'type', 'status', 'images'])
        ->when($availableStatusIds->isNotEmpty(), fn ($q) => $q->whereIn('status_id', $availableStatusIds), fn ($q) => $q->whereRaw('0 = 1'))
        ->latest()
        ->take(6)
        ->get();

    $propertyTypes = PropertyType::all();
    $locations = Location::whereNull('parent_id')->get();

    $stats = [
        'total_properties' => Property::when($availableStatusIds->isNotEmpty(), fn ($q) => $q->whereIn('status_id', $availableStatusIds), fn ($q) => $q->whereRaw('0 = 1'))->count(),
        'total_locations' => Location::count(),
        'total_types' => PropertyType::count(),
        'total_users' => User::count(),
    ];

    return view('welcome', compact('featuredProperties', 'stats', 'propertyTypes', 'locations'));
})->name('home');

Route::get('/dashboard', function () {
    $saleActiveStatusId = \App\Models\PropertyStatus::where('slug', 'unsold')->value('id');
    $rentalActiveStatusId = \App\Models\PropertyStatus::where('slug', 'available_for_rent')->value('id');
    $rentedOutStatusId = \App\Models\PropertyStatus::where('slug', 'rented_out')->value('id');

    $stats = [
        'total' => Property::count(),
        'active' => Property::where('is_sold', false)->where('status_id', 1)->count(),
        'sold' => Property::where('is_sold', true)->count(),
        'inactive' => Property::where('status_id', '!=', 1)->where('is_sold', false)->count(),
        'for_sale' => Property::where('listing_type', 'sale')->count(),
        'for_rent' => Property::where('listing_type', 'rental')->count(),
        'sale_active' => $saleActiveStatusId ? Property::where('listing_type', 'sale')->where('status_id', $saleActiveStatusId)->count() : 0,
        'rental_active' => $rentalActiveStatusId ? Property::where('listing_type', 'rental')->where('status_id', $rentalActiveStatusId)->count() : 0,
        'rented_out' => $rentedOutStatusId ? Property::where('listing_type', 'rental')->where('status_id', $rentedOutStatusId)->count() : 0,
        'locations' => Location::count(),
        'types' => PropertyType::count(),
        'users' => User::count(),
        'inquiries' => PropertyInquiry::count(),
        'pending_inquiries' => PropertyInquiry::where('status', 'pending')->count(),
    ];

    $recentProperties = Property::with(['location', 'type', 'status'])
        ->latest()
        ->take(5)
        ->get();

    $recentInquiries = PropertyInquiry::with(['property'])
        ->latest()
        ->take(5)
        ->get();

    $latestProperties = Property::with(['location', 'type', 'status'])
        ->latest()
        ->take(3)
        ->get();

    return view('dashboard', compact('stats', 'recentProperties', 'recentInquiries', 'latestProperties'));
})->middleware(['auth', 'admin', 'force.password.change'])->name('dashboard');

Route::middleware(['auth', 'admin', 'force.password.change'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', function () {
        return redirect()->route('dashboard');
    })->name('dashboard');

    Route::get('lookup/{type}', [LookupController::class, 'index'])->name('lookup.index');
    Route::get('lookup/{type}/create', [LookupController::class, 'create'])->name('lookup.create');
    Route::post('lookup/{type}', [LookupController::class, 'store'])->name('lookup.store');
    Route::get('lookup/{type}/{id}/edit', [LookupController::class, 'edit'])->name('lookup.edit');
    Route::put('lookup/{type}/{id}', [LookupController::class, 'update'])->name('lookup.update');
    Route::delete('lookup/{type}/{id}', [LookupController::class, 'destroy'])->name('lookup.destroy');

    Route::resource('locations', LocationController::class)->except(['show']);
    Route::resource('users', UserController::class)->except(['show']);

    Route::get('inquiries', [InquiryController::class, 'index'])->name('inquiries.index');
    Route::get('inquiries/{inquiry}', [InquiryController::class, 'show'])->name('inquiries.show');
    Route::patch('inquiries/{inquiry}/status', [InquiryController::class, 'updateStatus'])->name('inquiries.update-status');
    Route::delete('inquiries/{inquiry}', [InquiryController::class, 'destroy'])->name('inquiries.destroy');
});

Route::middleware(['auth', 'force.password.change'])->group(function () {
    Route::get('/force-password-change', [ForcePasswordChangeController::class, 'show'])->name('password.force.show');
    Route::put('/force-password-change', [ForcePasswordChangeController::class, 'update'])->name('password.force.update');
});

Route::middleware(['auth', 'force.password.change'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::resource('properties', PropertyController::class)->except(['index', 'show'])->middleware(['auth', 'admin', 'force.password.change']);

Route::resource('properties', PropertyController::class)->only(['index', 'show']);

Route::post('/properties/{property}/inquiries', [PropertyInquiryController::class, 'store'])
    ->middleware('throttle:inquiry')
    ->name('properties.inquiries.store');

require __DIR__.'/auth.php';
