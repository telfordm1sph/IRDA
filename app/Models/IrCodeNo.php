<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IrCodeNo extends Model
{
    protected $table = 'ir_code_no';

    protected $fillable = [
        'code_number',
        'violation',
        'status',
        'first_offense',
        'second_offense',
        'third_offense',
        'fourth_offense',
        'fifth_offense',
        'category',
        'root_cause',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public $timestamps = false;

    public function irLists()
    {
        return $this->hasMany(IrList::class, 'code_no', 'code_number');
    }
}
