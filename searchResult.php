<?php
require_once('../../../config.php');

// ── DataTables server-side params ──────────────────────────────────────────
$draw    = isset($_POST['draw'])   ? (int)$_POST['draw']   : 1;
$start   = isset($_POST['start'])  ? (int)$_POST['start']  : 0;
$length  = isset($_POST['length']) ? (int)$_POST['length'] : 10;
$search  = isset($_POST['search']['value']) ? $conn->real_escape_string(trim($_POST['search']['value'])) : '';

// ── App-level filters ──────────────────────────────────────────────────────
$resultType = isset($_POST['resultType']) ? (int)$_POST['resultType'] : 1;
$from_date  = '';
$to_date    = '';
$status     = 0;
$ir_no      = '';
$empId      = '';

switch ($resultType) {
    case 2:
        if (!empty($_POST['date_range'])) {
            $dates = explode(' - ', $_POST['date_range']);
            if (count($dates) >= 2) {
                $from_date = date('Y-m-d', strtotime($dates[0]));
                $to_date   = date('Y-m-d', strtotime($dates[1]));
            }
        }
        $status = isset($_POST['status']) ? (int)$_POST['status'] : 0;
        break;
    case 3:
        $ir_no = isset($_POST['ir_no']) ? $conn->real_escape_string(trim($_POST['ir_no'])) : '';
        break;
    case 4:
        $empId = isset($_POST['empId']) ? $conn->real_escape_string(trim($_POST['empId'])) : '';
        break;
}

// ── Permissions ────────────────────────────────────────────────────────────
$current_emp_id = $_settings->userdata('EMPLOYID');
$is_quality = $conn->query("SELECT 1 FROM ir_operator WHERE emp_no = '{$current_emp_id}' AND status = 1 AND to_handle = 2")->num_rows;

// ── WHERE clauses ──────────────────────────────────────────────────────────
$where = [];

if ($resultType == 2) {
    if ($from_date && $to_date) {
        $where[] = "ir.date_created BETWEEN '{$from_date}' AND '{$to_date}'";
    }
    switch ($status) {
        case 2:
            $where[] = "ir.is_inactive = 0";
            $where[] = "ir.why1 IS NULL";
            $where[] = "ir.hr_status = 1";
            break;
        case 3:
            $where[] = "ir.is_inactive = 0";
            $where[] = "(ir.why1 IS NOT NULL AND ir.why1 != '')";
            $where[] = "ir.hr_status = 1";
            $where[] = "ir.sv_status = 0";
            break;
        case 4:
            $where[] = "ir.is_inactive = 0";
            $where[] = "EXISTS (SELECT 1 FROM ir_list il WHERE ir.ir_no = il.ir_no AND il.valid = 1 AND il.date_of_suspension != '')";
            break;
        case 5:
            $where[] = "ir.is_inactive = 1";
            break;
    }
    if ($is_quality > 0) {
        $where[] = "ir.quality_violation = 2";
    }
} elseif ($resultType == 3 && $ir_no !== '') {
    $where[] = "ir.ir_no = '{$ir_no}'";
} elseif ($resultType == 4 && $empId !== '') {
    $where[] = "ir.emp_no = '{$empId}'";
}

// ── Global search (applied to searchable columns including status display) ──
if ($search !== '') {
    $status_conditions = [];
    $search_lower = strtolower($search);

    // Check for partial matches in status texts
    // This will match any status that contains the search term
    $status_text_conditions = [];

    // Map status texts to their conditions - now using LIKE for partial matching
    if (strpos($search_lower, 'inactive') !== false) {
        $status_text_conditions[] = "ir.is_inactive = 1";
    }

    if (strpos($search_lower, 'pending') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 0 AND ir.hr_status = 0)";
    }

    if (strpos($search_lower, 'served') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 2 AND EXISTS (SELECT 1 FROM ir_list WHERE valid=1 AND ir_no=ir.ir_no AND offense_no REGEXP '^[0-9]+$'))";
    }

    if (strpos($search_lower, 'da') !== false || strpos($search_lower, 'for da') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 2 AND ir.has_da = 0)";
        // Also match DA related statuses
        $status_text_conditions[] = "(ir.ir_status = 2 AND ir.has_da = 1 AND ir.da_status = 1)"; // For HR Manager
        $status_text_conditions[] = "(ir.ir_status = 2 AND ir.has_da = 1 AND ir.da_status = 2)"; // DA: For Supervisor
        $status_text_conditions[] = "(ir.ir_status = 2 AND ir.has_da = 1 AND (ir.da_status = 3 OR ir.da_status = 2))"; // DA: For Department manager
    }

    if (strpos($search_lower, 'appeal') !== false) {
        $status_text_conditions[] = "ir.appeal_status IN (1,2)";
    }

    if (strpos($search_lower, 'acknowledged') !== false || strpos($search_lower, 'acknowledge') !== false) {
        $status_text_conditions[] = "ir.da_status = 5";
    }

    if (strpos($search_lower, 'invalid') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 2 AND NOT EXISTS (SELECT 1 FROM ir_list WHERE valid=1 AND ir_no=ir.ir_no AND offense_no REGEXP '^[0-9]+$') AND EXISTS (SELECT 1 FROM ir_list WHERE valid=1 AND ir_no=ir.ir_no))";
    }

    if (strpos($search_lower, 'hr') !== false || strpos($search_lower, 'manager') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 2 AND ir.has_da = 1 AND ir.da_status = 1)";
    }

    if (strpos($search_lower, 'supervisor') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 2 AND ir.has_da = 1 AND ir.da_status = 2 AND ir.APPROVER1 != ir.APPROVER3)";
    }

    if (strpos($search_lower, 'department manager') !== false || (strpos($search_lower, 'department') !== false && strpos($search_lower, 'manager') !== false)) {
        $status_text_conditions[] = "(ir.ir_status = 2 AND ir.has_da = 1 AND ((ir.da_status = 3) OR (ir.da_status = 2 AND ir.APPROVER1 = ir.APPROVER3)) AND (ir.appeal_status NOT IN (1,2)))";
    }

    if (strpos($search_lower, 'letter') !== false || strpos($search_lower, 'explanation') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 1 AND (ir.why1 IS NULL OR ir.why1 = '') AND ir.sv_status = 0)";
    }

    if (strpos($search_lower, 'assessment') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 1 AND ir.sv_status = 0 AND ir.why1 IS NOT NULL AND ir.why1 != '')";
    }

    if (strpos($search_lower, 'approval') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 1 AND ir.sv_status = 1 AND ir.da_status = 1)";
    }

    if (strpos($search_lower, 'validation') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 1 AND ir.sv_status = 1 AND ir.da_status = 0)";
    }

    if (strpos($search_lower, 'cancel') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 4)";
    }

    if (strpos($search_lower, 'disapproved') !== false) {
        $status_text_conditions[] = "(ir.ir_status = 0 AND ir.hr_status = 2)";
    }

    // Search in text fields (IR number, employee name, product line, department, violation details)
    $text_search = "(ir.ir_no LIKE '%{$search}%'
    OR emp.EMPNAME LIKE '%{$search}%'
    OR ir.productline LIKE '%{$search}%'
    OR ir.department LIKE '%{$search}%'
    OR v.code_suspension_summary LIKE '%{$search}%')";

    if (!empty($status_text_conditions)) {
        $where[] = "(" . implode(' OR ', array_merge($status_text_conditions, [$text_search])) . ")";
    } else {
        $where[] = $text_search;
    }
}
$where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// ── ORDER BY ───────────────────────────────────────────────────────────────
$col_map = [
    1 => 'ir.date_created',
    2 => 'ir.ir_no',
    3 => 'emp.EMPNAME',
    6 => 'ir.productline',
    7 => 'ir.department',
];
$order_col = isset($_POST['order'][0]['column']) ? (int)$_POST['order'][0]['column'] : 1;
$order_dir = (isset($_POST['order'][0]['dir']) && strtolower($_POST['order'][0]['dir']) === 'asc') ? 'ASC' : 'DESC';
$order_sql = 'ORDER BY ' . ($col_map[$order_col] ?? 'ir.date_created') . " {$order_dir}";

// ── Base query (no LIMIT) ──────────────────────────────────────────────────
$base_query = "
    FROM ir_requests ir
    LEFT JOIN employee_masterlist emp ON ir.emp_no = emp.EMPLOYID
    LEFT JOIN employee_masterlist sv  ON sv.EMPLOYID = (
        CASE WHEN emp.APPROVER1 = 'na' THEN emp.APPROVER2
             WHEN emp.APPROVER2 = 'na' THEN emp.APPROVER3
             ELSE emp.APPROVER1 END)
    LEFT JOIN employee_masterlist emp_hr ON emp_hr.EMPLOYID = ir.hr_name
    LEFT JOIN (
        SELECT il.ir_no,
               GROUP_CONCAT(
                   CONCAT(il.code_no,
                       IF(il.date_of_suspension IS NOT NULL AND il.date_of_suspension != '',
                           CONCAT(' | ', il.date_of_suspension), ''))
                   ORDER BY il.id ASC SEPARATOR '||'
               ) AS code_suspension_summary
        FROM ir_list il
        GROUP BY il.ir_no
    ) v ON v.ir_no = ir.ir_no
    {$where_sql}
";

// Counts
$total_res    = $conn->query("SELECT COUNT(*) as cnt FROM ir_requests");
$total        = $total_res ? (int)$total_res->fetch_assoc()['cnt'] : 0;
$filtered_res = $conn->query("SELECT COUNT(*) as cnt {$base_query}");
$filtered     = $filtered_res ? (int)$filtered_res->fetch_assoc()['cnt'] : 0;

// Data query
$data_query = "
    SELECT ir.*,
           emp.EMPNAME        AS issued_to,
           sv.EMPNAME         AS supervisor_name,
           emp_hr.EMPNAME     AS hr_fullname,
           emp.APPROVER1, emp.APPROVER2, emp.APPROVER3,
           v.code_suspension_summary
    {$base_query}
    {$order_sql}
    LIMIT {$start}, {$length}
";

$qry = $conn->query($data_query);

if (!$qry) {
    echo json_encode(['draw' => $draw, 'recordsTotal' => 0, 'recordsFiltered' => 0, 'data' => [], 'error' => $conn->error]);
    exit;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getStatusDisplay($row, $conn)
{
    if ($row['is_inactive'] == 1)
        return ['type' => 'badge', 'class' => 'badge-danger', 'content' => 'Inactive'];

    $ir_status    = $row['ir_status'];
    $hr_status    = $row['hr_status'];
    $sv_status    = $row['sv_status'];
    $da_status    = $row['da_status'];
    $why1         = $row['why1'];
    $has_da       = $row['has_da'];
    $appeal_status = $row['appeal_status'];

    $c        = $conn->query("SELECT valid FROM ir_list WHERE valid=1 AND ir_no='{$row['ir_no']}' AND offense_no REGEXP '^[0-9]+$'")->num_rows;
    $is_valid = $conn->query("SELECT valid FROM ir_list WHERE valid=1 AND ir_no='{$row['ir_no']}'")->num_rows;

    $approver_1 = $row['APPROVER1'] ?? '';
    $approver_2 = $row['APPROVER2'] ?? '';
    $approver_3 = $row['APPROVER3'] ?? '';
    $approver_1 = ($approver_1 == 'na') ? $approver_2 : $approver_1;

    if ($ir_status == 2) {
        if ($c == 0) {
            return $is_valid > 0
                ? ['type' => 'badge', 'class' => 'badge-success',   'content' => 'Served']
                : ['type' => 'badge', 'class' => 'badge-danger',    'content' => 'Invalid Dispositions'];
        }
        if ($has_da == 0) return ['type' => 'badge', 'class' => 'badge-warning',   'content' => 'For DA'];
        if ($has_da == 1) {
            if ($da_status == 1) return ['type' => 'badge', 'class' => 'badge-danger',    'content' => 'For HR Manager'];
            if ($da_status == 2 && $approver_1 != $approver_3) return ['type' => 'badge', 'class' => 'badge-secondary', 'content' => 'DA: For Supervisor'];
            if ($da_status == 3 || ($da_status == 2 && $approver_1 == $approver_3)) {
                $content = ($appeal_status == 1 || $appeal_status == 2) ? 'For Appeal' : 'DA: For Department manager';
                return ['type' => 'badge', 'class' => 'badge-secondary', 'content' => $content];
            }
            if ($da_status == 4) return ['type' => 'badge', 'class' => 'badge-danger',  'content' => 'For Acknowledgement'];
            if ($da_status == 5) return ['type' => 'badge', 'class' => 'badge-success', 'content' => 'Acknowledged'];
            return ['type' => 'badge', 'class' => 'badge-secondary', 'content' => 'Cancelled'];
        }
    }

    if ($ir_status == 0 && $hr_status == 2) {
        $dpr = $conn->query("SELECT EMPNAME FROM employee_masterlist WHERE EMPLOYID='{$row['hr_name']}'")->fetch_array();
        return ['type' => 'text', 'content' => "Disapproved by: " . ($dpr[0] ?? '') . "<br>Reason: " . $row['disapprove_remarks']];
    }
    if ($ir_status == 0 && $hr_status == 0) return ['type' => 'badge', 'class' => 'badge-primary',   'content' => 'Pending'];
    if ($ir_status == 1 && empty($why1) && $sv_status == 0) return ['type' => 'badge', 'class' => 'badge-warning',   'content' => 'Letter of explanation'];
    if ($ir_status == 1 && $sv_status == 0 && !empty($why1)) return ['type' => 'badge', 'class' => 'badge-secondary', 'content' => 'For assessment'];
    if ($ir_status == 1 && $sv_status == 1 && $da_status == 1) return ['type' => 'badge', 'class' => 'badge-warning',   'content' => 'IR: For approval department'];
    if ($ir_status == 1 && $sv_status == 1 && $da_status == 0) return ['type' => 'badge', 'class' => 'badge-primary',   'content' => 'For Validation'];
    if ($ir_status == 3 && $da_status == 2) {
        $n = $conn->query("SELECT EMPNAME FROM employee_masterlist WHERE EMPLOYID='{$row['valid_to_da_name']}'")->fetch_array();
        return ['type' => 'text', 'content' => "Invalid by: " . ($n[0] ?? '') . "<br>Reason: " . $row['disapprove_remarks']];
    }
    $dpr = $conn->query("SELECT EMPNAME FROM employee_masterlist WHERE EMPLOYID='{$row['hr_name']}'")->fetch_array();
    return ['type' => 'text', 'content' => "Cancelled by: " . ($dpr[0] ?? '') . "<br>Reason: " . $row['disapprove_remarks']];
}

function formatViolationDetails($code_suspension_summary)
{
    if (empty($code_suspension_summary)) return '--';
    $output = '';
    foreach (explode('||', $code_suspension_summary) as $entry) {
        $parts   = explode(' | ', $entry, 2);
        $code_no = htmlspecialchars($parts[0]);
        $dates   = $parts[1] ?? '';
        $output .= "Code no: {$code_no}<br>";
        if (!empty($dates)) {
            $output .= "Suspension Date:<br>";
            $hasValid = false;
            foreach (explode(' + ', $dates) as $k => $d) {
                $ts = strtotime(trim($d));
                if (!$ts || empty(trim($d))) continue;
                $hasValid = true;
                $dt = new DateTime();
                $dt->setTimestamp($ts);
                $output .= "Day" . ($k + 1) . " = " . $dt->format('m/d/Y') . " (" . $dt->format('D') . ")<br>";
            }
            if (!$hasValid) $output .= "--<br>";
        } else {
            $output .= "Suspension Date: --<br>";
        }
        $output .= "<br>";
    }
    return $output;
}

function buildActionHtml($row, $current_emp_id, $conn)
{
    $base = defined('base_url') ? base_url : '';
    $c    = $conn->query("SELECT valid FROM ir_list WHERE valid=1 AND ir_no='{$row['ir_no']}' AND offense_no REGEXP '^[0-9]+$'")->num_rows;
    $id_hash = md5($row['id']);

    $html  = '<button type="button" class="btn btn-flat btn-default btn-sm dropdown-toggle dropdown-icon" data-toggle="dropdown">Action <span class="sr-only">Toggle Dropdown</span></button>';
    $html .= '<div class="dropdown-menu" role="menu">';
    $html .= '<a class="dropdown-item" href="' . $base . 'admin?page=incidentreport/manageIRDA/view_ir&id=' . $id_hash . '"><span class="fa fa-eye text-dark"></span> View</a>';

    if ($row['ir_status'] == 2 && $c > 0) {
        $html .= '<div class="dropdown-divider"></div>';
        $html .= '<a class="dropdown-item" href="' . $base . 'admin?page=incidentreport/manageIRDA/viewDA&id=' . $id_hash . '"><span class="fa fa-pen text-dark"></span> View DA</a>';
    }
    if ($row['is_inactive'] == 0) {
        $html .= '<div class="dropdown-divider"></div>';
        $html .= '<a class="dropdown-item inactive_data" href="javascript:void(0)" data-id="' . htmlspecialchars($row['emp_no']) . '"><span class="fa fa-ban text-danger"></span> Inactive</a>';
    }
    if ($row['is_inactive'] == 0 && $row['ir_status'] < 4) {
        $html .= '<div class="dropdown-divider"></div>';
        $html .= '<a class="dropdown-item cancel_data" href="javascript:void(0)" data-id="' . $row['id'] . '" data-val="2" data-sign="3" data-name="' . $current_emp_id . '"><i class="fas fa-trash text-danger"></i> Cancel</a>';
    }
    $html .= '</div>';
    return '<div class="dropdown">' . $html . '</div>';
}

// ── Build response rows ────────────────────────────────────────────────────
$data = [];
$i    = $start + 1;

while ($row = $qry->fetch_assoc()) {
    $status_info = getStatusDisplay($row, $conn);
    $status_html = $status_info['type'] === 'badge'
        ? '<span class="badge ' . $status_info['class'] . ' rounded-pill">' . htmlspecialchars($status_info['content']) . '</span>'
        : '<div class="text-left">' . $status_info['content'] . '</div>';

    $data[] = [
        'row_num'      => $i++,
        'date_created' => date('m-d-Y', strtotime($row['date_created'])),
        'ir_no'        => htmlspecialchars($row['ir_no']),
        'issued_to'    => htmlspecialchars($row['issued_to'] ?? ''),
        'supervisor'   => htmlspecialchars($row['supervisor_name'] ?? ''),
        'updated_sv'   => htmlspecialchars($row['supervisor_name'] ?? ''),  // same JOIN alias
        'productline'  => htmlspecialchars($row['productline'] ?? ''),
        'department'   => htmlspecialchars($row['department'] ?? ''),
        'status_html'  => $status_html,
        'remarks_html' => formatViolationDetails($row['code_suspension_summary']),
        'action_html'  => buildActionHtml($row, $current_emp_id, $conn),
    ];
}

header('Content-Type: application/json');
echo json_encode([
    'draw'            => $draw,
    'recordsTotal'    => $total,
    'recordsFiltered' => $filtered,
    'data'            => $data,
]);
