<?php

namespace App\Repositories;

use App\Constants\IrConstants;
use App\Models\IrApproval;
use App\Models\IrCodeNo;
use App\Models\IrList;
use App\Models\IrRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class IrRequestRepository
{
    public function generateIrNo(): string
    {
        $year   = Carbon::now()->year;
        $prefix = $year . '-';

        $last = IrRequest::where('ir_no', 'like', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING(ir_no, ' . (strlen($prefix) + 1) . ') AS UNSIGNED) DESC')
            ->lockForUpdate()
            ->value('ir_no');

        $seq = $last ? ((int) substr($last, strlen($prefix)) + 1) : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    public function getActiveCodeNumbers(): \Illuminate\Support\Collection
    {
        return IrCodeNo::where('status', 1)
            ->orderBy('code_number')
            ->get([
                'id',
                'code_number',
                'violation',
                'category',
                'first_offense',
                'second_offense',
                'third_offense',
                'fourth_offense',
                'fifth_offense'
            ]);
    }

    public function getActiveCodeNumbersPaginated(int $page = 1, int $perPage = 15): array
    {
        $query = IrCodeNo::where('status', 1)
            ->orderBy('code_number')
            ->select('id', 'code_number', 'violation', 'category', 'first_offense', 'second_offense', 'third_offense', 'fourth_offense', 'fifth_offense');

        $total = $query->count();
        $items = $query->forPage($page, $perPage)->get();

        return [
            'data' => $items,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage),
        ];
    }

    public function store(array $data): IrRequest
    {
        return DB::transaction(function () use ($data) {
            $irNo = $this->generateIrNo();

            $ir = IrRequest::create([
                'ir_no'             => $irNo,
                'emp_no'            => $data['emp_no'],
                'requestor_id'      => $data['requestor_id'],
                'quality_violation' => (int) $data['quality_violation'],
                'reference'         => $data['reference'] ?? null,
                'what'              => $data['what'],
                'when_date'         => $data['when_date'],
                'where_loc'         => $data['where_loc'],
                'how'               => $data['how'],
                'ir_status'         => IrConstants::IR_STATUS_PENDING,
                'read_status'       => IrConstants::READ_UNREAD,
                'is_inactive'       => 0,
                'date_created'      => now(),
                'date_updated'      => now(),
            ]);

            foreach ($data['items'] as $item) {
                IrList::create([
                    'ir_no'          => $irNo,
                    'emp_no'         => $data['emp_no'],
                    'code_no'        => $item['code_no'],
                    'violation'      => $item['violation'],
                    'da_type'        => $item['da_type'],
                    'date_committed' => $item['date_committed'],
                    'offense_no'     => $item['offense_no'] ?? null,
                    'valid'          => 1,
                    'cleansed'       => 0,
                ]);
            }

            foreach ($data['approvals'] ?? [] as $approval) {
                if (empty($approval['approver_name'])) {
                    continue;
                }
                IrApproval::create([
                    'ir_no'           => $irNo,
                    'role'            => $approval['role'],
                    'approver_emp_no' => $approval['approver_emp_no'] ?? null,
                    'approver_name'   => $approval['approver_name'],
                    'status'          => 0,
                ]);
            }

            return $ir;
        });
    }
}
