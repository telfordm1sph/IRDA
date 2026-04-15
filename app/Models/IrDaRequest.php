<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IrDaRequest extends Model
{
    protected $table = 'ir_da_requests';

    protected $fillable = [
        'ir_no',
        'da_type',
        'da_requestor_emp_no',
        'da_requested_date',
        'da_others',
        'da_status',
        'valid_to_da_emp_no',
        'valid_to_da_date',
        'acknowledge_da',
        'acknowledge_date',
    ];

    protected $casts = [
        'da_requested_date' => 'date',
        'valid_to_da_date'  => 'datetime',
        'acknowledge_date'  => 'date',
        'acknowledge_da'    => 'boolean',
    ];

    public $timestamps = false;

    public function irRequest()
    {
        return $this->belongsTo(IrRequest::class, 'ir_no', 'ir_no');
    }
}
