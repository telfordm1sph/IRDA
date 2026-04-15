<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IrAppeal extends Model
{
    protected $table = 'ir_appeals';

    protected $fillable = [
        'ir_no',
        'appeal_emp_no',
        'appeal_status',
        'appeal_remarks',
        'date_of_appeal',
        'valid_appeal_emp_no',
        'valid_appeal_sign_date',
    ];

    protected $casts = [
        'date_of_appeal'        => 'datetime',
        'valid_appeal_sign_date' => 'datetime',
    ];

    public $timestamps = false;

    public function irRequest()
    {
        return $this->belongsTo(IrRequest::class, 'ir_no', 'ir_no');
    }
}
