<?php

namespace App\Models;

use Database\Factories\PropertyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    /** @use HasFactory<PropertyFactory> */
    use HasFactory;
    protected $fillable = [
        'title',
        'listing_type',
        'description',
        'area_total',
        'area_useful',
        'land_length',
        'land_width',
        'land_area',
        'year_built',
        'orientation',
        'bedrooms',
        'bathrooms',
        'floor',
        'total_floors',
        'units_count',
        'has_parking',
        'parking_count',
        'has_elevator',
        'has_storage',
        'has_balcony',
        'has_garden',
        'status_id',
        'price',
        'deposit_amount',
        'rent_amount',
        'is_sold',
        'address_fa',
        'type_id',
        'location_id',
        'owner_id'
    ];
    protected $casts = [
        'has_parking' => 'boolean',
        'has_elevator' => 'boolean',
        'has_storage' => 'boolean',
        'has_balcony' => 'boolean',
        'has_garden' => 'boolean',
        'is_sold' => 'boolean',
        'price' => 'integer',
        'deposit_amount' => 'integer',
        'rent_amount' => 'integer',
    ];

    public function status(): BelongsTo
    {
        return $this->belongsTo(PropertyStatus::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(PropertyType::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(PropertyFile::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(PropertyInquiry::class);
    }


    public function climateSystems(): BelongsToMany
    {
        return $this->belongsToMany(ClimateSystem::class, 'property_climate_systems');
    }

    public function floorMaterials(): BelongsToMany
    {
        return $this->belongsToMany(FloorMaterial::class, 'property_floor_materials');
    }

    public function buildingMaterials(): BelongsToMany
    {
        return $this->belongsToMany(BuildingMaterial::class, 'property_building_materials');
    }

    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'property_documents');
    }

    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'property_features');
    }

    public function isForSale(): bool
    {
        return $this->listing_type === 'sale';
    }

    public function isForRent(): bool
    {
        return $this->listing_type === 'rental';
    }
}
