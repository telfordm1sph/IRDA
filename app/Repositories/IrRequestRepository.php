<?php

namespace App\Repositories;

use App\Constants\IrConstants;
use App\Models\IrApproval;
use App\Models\IrCodeNo;
use App\Models\IrList;
use App\Models\IrRequest;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
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

    /**
     * @param int   $empId        Logged-in employee ID
     * @param array $filters      Search/filter parameters
     * @param array $staffEmpIds  Direct-report emp_ids from HRIS (empty = regular employee view)
     */
    public function listPaginated(int $empId, array $filters, array $staffEmpIds = []): LengthAwarePaginator
    {
        $query = IrRequest::with([
            'approvals',
            'daRequest',
            'irList' => fn ($q) => $q->where('valid', 1)->select('ir_no', 'code_no', 'violation', 'da_type', 'offense_no'),
            'reasons' => fn ($q) => $q->limit(1),
        ]);

        // Scope: supervisor sees their direct reports' IRs; regular employee sees only their own
        if (!empty($staffEmpIds)) {
            // If supervisor has selected a specific employee, narrow to that one
            $selectedEmp = !empty($filters['empId']) ? (int) $filters['empId'] : null;
            if ($selectedEmp && in_array($selectedEmp, $staffEmpIds)) {
                $query->where('emp_no', $selectedEmp);
            } else {
                $query->whereIn('emp_no', $staffEmpIds);
            }
        } else {
            $query->where('emp_no', $empId);
        }

        // Active vs History tab
        $tab = $filters['tab'] ?? 'active';
        if ($tab === 'history') {
            // Done: acknowledged, served, invalid, cancelled, inactive
            $query->where(function (Builder $q) {
                $q->where('is_inactive', 1)
                  ->orWhere('ir_status', IrConstants::IR_INVALID)
                  ->orWhere('ir_status', IrConstants::IR_CANCELLED)
                  ->orWhere(fn ($q2) => $q2
                      ->where('ir_status', IrConstants::IR_APPROVED)
                      ->whereHas('daRequest', fn ($d) => $d->where('da_status', IrConstants::DA_ACKNOWLEDGED))
                  );
            });
        } else {
            // Active: still in progress
            $query->where('is_inactive', 0)
                  ->where(function (Builder $q) {
                      $q->whereIn('ir_status', [IrConstants::IR_PENDING, IrConstants::IR_VALIDATED])
                        ->orWhere(fn ($q2) => $q2
                            ->where('ir_status', IrConstants::IR_APPROVED)
                            ->where(fn ($q3) => $q3
                                ->doesntHave('daRequest')
                                ->orWhereHas('daRequest', fn ($d) => $d->where('da_status', '<', IrConstants::DA_ACKNOWLEDGED))
                            )
                        );
                  });
        }

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(fn (Builder $q) => $q
                ->where('ir_no', 'like', "%{$s}%")
                ->orWhere('emp_no', 'like', "%{$s}%")
                ->orWhereHas('irList', fn ($l) => $l->where('code_no', 'like', "%{$s}%")
                    ->orWhere('violation', 'like', "%{$s}%"))
            );
        }

        if (!empty($filters['status'])) {
            $query = $this->applyStatusFilter($query, $filters['status']);
        }

        if (!empty($filters['start']) && !empty($filters['end'])) {
            $query->whereBetween('date_created', [
                $filters['start'] . ' 00:00:00',
                $filters['end']   . ' 23:59:59',
            ]);
        }

        return $query
            ->orderBy('date_created', 'desc')
            ->paginate((int) ($filters['perPage'] ?? 15))
            ->withQueryString();
    }

    private function applyStatusFilter(Builder $query, string $status): Builder
    {
        return match ($status) {
            'Inactive' => $query->where('is_inactive', 1),

            'Pending' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_PENDING)
                ->whereDoesntHave('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_HR)
                    ->where('status', IrConstants::APPROVAL_DISAPPROVED)),

            'Disapproved' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_PENDING)
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_HR)
                    ->where('status', IrConstants::APPROVAL_DISAPPROVED)),

            'Letter of Explanation' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_VALIDATED)
                ->whereDoesntHave('reasons'),

            'For Assessment' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_VALIDATED)
                ->whereHas('reasons')
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_SV)
                    ->where('status', IrConstants::APPROVAL_PENDING)),

            'For Validation' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_VALIDATED)
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_SV)
                    ->where('status', IrConstants::APPROVAL_APPROVED))
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_HR)
                    ->where('status', IrConstants::APPROVAL_PENDING)),

            'IR: For Dept Approval' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_VALIDATED)
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_SV)
                    ->where('status', IrConstants::APPROVAL_APPROVED))
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_HR)
                    ->where('status', IrConstants::APPROVAL_APPROVED))
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_DH)
                    ->where('status', IrConstants::APPROVAL_PENDING)),

            'For DA' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereDoesntHave('daRequest'),

            'For HR Manager' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_FOR_HR_MANAGER)),

            'DA: For Supervisor' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_FOR_SUPERVISOR)),

            'DA: For Dept Manager' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_FOR_DEPT_MANAGER)),

            'For Acknowledgement' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_FOR_ACKNOWLEDGEMENT)),

            'Acknowledged' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_ACKNOWLEDGED)),

            'Invalid'   => $query->where('is_inactive', 0)->where('ir_status', IrConstants::IR_INVALID),
            'Cancelled' => $query->where('is_inactive', 0)->where('ir_status', IrConstants::IR_CANCELLED),

            default => $query,
        };
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
                'ir_status'         => IrConstants::IR_PENDING,
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
