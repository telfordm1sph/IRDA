<?php

namespace App\Http\Controllers;

use App\Constants\IrConstants;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Dashboard', [
            'stats' => fn () => $this->stats(),
        ]);
    }

    private function stats(): array
    {
        // ── Status counts ────────────────────────────────────────────────────────
        $statusCounts = DB::table('ir_requests')
            ->select('ir_status', DB::raw('COUNT(*) as count'))
            ->groupBy('ir_status')
            ->pluck('count', 'ir_status')
            ->toArray();

        $pending    = (int) ($statusCounts[IrConstants::IR_PENDING]   ?? 0);
        $inProgress = (int) ($statusCounts[IrConstants::IR_VALIDATED] ?? 0);
        $approved   = (int) ($statusCounts[IrConstants::IR_APPROVED]  ?? 0);
        $invalid    = (int) ($statusCounts[IrConstants::IR_INVALID]   ?? 0);
        $cancelled  = (int) ($statusCounts[IrConstants::IR_CANCELLED] ?? 0);
        $total      = $pending + $inProgress + $approved + $invalid + $cancelled;

        // IRs that have a fully acknowledged DA
        $acknowledged = DB::table('ir_requests')
            ->join('ir_da_requests', 'ir_requests.ir_no', '=', 'ir_da_requests.ir_no')
            ->where('ir_da_requests.da_status', IrConstants::DA_ACKNOWLEDGED)
            ->count();

        // ── Monthly trend — last 12 months ───────────────────────────────────────
        $monthlyRaw = DB::table('ir_requests')
            ->select(
                DB::raw('DATE_FORMAT(date_created, "%Y-%m") as month'),
                DB::raw('COUNT(*) as count')
            )
            ->where('date_created', '>=', Carbon::now()->subMonths(11)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        // Fill in every month in the range (so gaps show as 0)
        $monthly = [];
        for ($i = 11; $i >= 0; $i--) {
            $key = Carbon::now()->subMonths($i)->format('Y-m');
            $monthly[] = [
                'month' => Carbon::now()->subMonths($i)->format('M Y'),
                'count' => (int) ($monthlyRaw[$key] ?? 0),
            ];
        }

        // ── Top 10 violation codes ────────────────────────────────────────────────
        $topViolations = DB::table('ir_list')
            ->select('code_no', DB::raw('COUNT(*) as count'))
            ->whereNotNull('code_no')
            ->where('code_no', '!=', '')
            ->groupBy('code_no')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                // Optionally join violation name from ir_code_no
                $name = DB::table('ir_code_no')
                    ->where('code_number', $row->code_no)
                    ->value('violation');
                return [
                    'code'      => $row->code_no,
                    'violation' => $name ? (strlen($name) > 40 ? substr($name, 0, 40) . '…' : $name) : $row->code_no,
                    'count'     => (int) $row->count,
                ];
            })
            ->toArray();

        // ── DA type distribution ─────────────────────────────────────────────────
        $daTypeRaw = DB::table('ir_list')
            ->select('da_type', DB::raw('COUNT(*) as count'))
            ->whereNotNull('da_type')
            ->where('da_type', '>', 0)
            ->groupBy('da_type')
            ->pluck('count', 'da_type')
            ->toArray();

        $daTypes = collect(IrConstants::DA_TYPES)
            ->map(fn ($label, $key) => [
                'label' => $label,
                'count' => (int) ($daTypeRaw[$key] ?? 0),
            ])
            ->values()
            ->toArray();

        // ── Violation type split ─────────────────────────────────────────────────
        $adminCount   = DB::table('ir_requests')->where('quality_violation', IrConstants::VIOLATION_ADMINISTRATIVE)->count();
        $qualityCount = DB::table('ir_requests')->where('quality_violation', IrConstants::VIOLATION_QUALITY)->count();

        return [
            'total'        => $total,
            'pending'      => $pending,
            'inProgress'   => $inProgress,
            'approved'     => $approved,
            'invalid'      => $invalid,
            'cancelled'    => $cancelled,
            'acknowledged' => $acknowledged,
            'monthly'      => $monthly,
            'topViolations'=> $topViolations,
            'daTypes'      => $daTypes,
            'violationType'=> [
                ['label' => 'Administrative', 'count' => $adminCount],
                ['label' => 'Quality',        'count' => $qualityCount],
            ],
        ];
    }
}
