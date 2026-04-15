<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IrList extends Model
{
    protected $table = 'ir_list';

    protected $fillable = [
        'ir_no',
        'emp_no',
        'code_no',
        'violation',
        'da_type',
        'date_committed',
        'offense_no',
        'disposition',
        'DATE_of_suspension',
        'days_no',
        'valid',
        'cleansed',
        'appeal_da_type',
        'appeal_days',
        'appeal_date',
        'date_of_LOE',
    ];

    protected $casts = [
        'DATE_of_suspension' => 'date',
        'date_of_LOE'        => 'datetime',
        'valid'              => 'boolean',
        'cleansed'           => 'boolean',
    ];

    public $timestamps = false;

    public function irRequest()
    {
        return $this->belongsTo(IrRequest::class, 'ir_no', 'ir_no');
    }

    public function codeNo()
    {
        return $this->belongsTo(IrCodeNo::class, 'code_no', 'code_number');
    }
}
