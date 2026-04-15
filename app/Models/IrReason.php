<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IrReason extends Model
{
    protected $table = 'ir_reasons';

    protected $fillable = [
        'ir_no',
        'seq',
        'reason_text',
    ];

    public $timestamps = false;

    public function irRequest()
    {
        return $this->belongsTo(IrRequest::class, 'ir_no', 'ir_no');
    }
}
