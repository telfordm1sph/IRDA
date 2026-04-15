<style>
    td {
        vertical-align: middle;
    }
</style>
<div class="card card-outline card-primary">
    <div class="card-header p-0 pt-1 ">
        <ul class="nav nav-tabs" id="custom-tabs-one-tab" role="tablist">
            <li class="pt-2 px-3">
                <h3 class="card-title">List of Incident Reports</h3>
            </li>
            <li class="nav-item">
                <a class="nav-link active" id="custom-tabs-one-active-tab" data-toggle="pill" href="#custom-tabs-one-active" role="tab" aria-controls="custom-tabs-one-active" aria-selected="true">Active</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="custom-tabs-one-history-tab" data-toggle="pill" href="#custom-tabs-one-history" role="tab" aria-controls="custom-tabs-one-history" aria-selected="false">History</a>
            </li>
            <li class="nav-item ml-auto">
                <a href="javascript:void(0)" class="btn btn-flat btn-outline-info btn-s" id="selectAllButton"><i class="fas fa-check-double"></i> <span class="btn-text">Select All</span></a>
                <button class="btn btn-flat btn btn-outline-success btn-s approve_data" type="submit" form="irda-form"> <i class="fas fa-thumbs-up"></i> Approve</button>
            </li>
        </ul>
    </div>
    <div class="card-body">
        <div class="tab-content" id="custom-tabs-one-tabContent">
            <div class="tab-pane fade show active" id="custom-tabs-one-active" role="tabpanel" aria-labelledby="custom-tabs-one-active-tab">
                <div class="container-fluid">
                    <form id="irda-form">
                        <table class="table table-bordered table-stripped">
                            <thead>
                                <tr class="bg-gradient-primary text-center">
                                    <th>#</th>
                                    <th></th>
                                    <th>IR No</th>
                                    <th>Date Created</th>
                                    <th>Issued to</th>
                                    <th>Code No</th>
                                    <th>Violation</th>
                                    <th>Remarks</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $i = 1;
                                // --- 1. Run your main $ir_da_qry as before (keep your existing logic for building $ir_da_qry) ---
                                if ($is_operator > 0 && $is_quality > 0) {
                                    $empID = $_settings->userdata('EMPLOYID');
                                    $ir_da_qry = $conn->query("SELECT * FROM ir_requests WHERE ((ir_status = 3 AND emp_no IN (SELECT EMPLOYID FROM employee_masterlist WHERE (APPROVER1 != 'na' AND APPROVER1 = '{$empID}')  OR (APPROVER1 = 'na' AND APPROVER2 = '{$empID}')) AND is_inactive = 0) OR (hr_status = 0 AND is_inactive = 0) OR (hr_status = 1 AND why1 != '' AND sv_status = 0 AND emp_no IN (SELECT EMPLOYID FROM employee_masterlist WHERE (APPROVER1 != 'na' AND APPROVER1 = '{$empID}') 
    OR (APPROVER1 = 'na' AND APPROVER2 = '{$empID}')) AND da_status = 0 AND is_inactive = 0)OR (hr_status = 1 AND why1 != '' AND sv_status = 1 AND ir_status = 1 AND da_status = 0 AND quality_violation = 1 AND is_inactive = 0) OR (hr_status = 1 AND why1 != '' AND sv_status = 1 AND ir_status = 2 AND sv_name = '{$empID}' AND da_status = 2 AND is_inactive = 0)        
    -- Quality-specific conditions
   OR (hr_status = 0 AND quality_violation = 2 AND is_inactive = 0) OR (hr_status = 1 AND why1 != '' AND sv_status = 1 AND ir_status = 1 
   AND quality_violation = 2 AND da_status = 0 AND is_inactive = 0) OR (ir_status = 1 AND is_inactive = 0 AND hr_status = 1 AND why1 != '' AND sv_status = 0 AND emp_no IN (SELECT EMPLOYID FROM employee_masterlist WHERE (APPROVER1 != 'na' AND APPROVER1 = '{$empID}') OR (APPROVER1 = 'na' AND APPROVER2 = '{$empID}')))
   OR (ir_status = 3 AND is_inactive = 0 AND emp_no IN (SELECT EMPLOYID FROM employee_masterlist WHERE (APPROVER1 != 'na' AND APPROVER1 = '{$empID}') OR (APPROVER1 = 'na' AND APPROVER2 = '{$empID}'))))ORDER BY `date_created` ASC");
                                } elseif ($is_operator > 0) {
                                    $ir_da_qry = $conn->query("SELECT * FROM ir_requests where (ir_status = 3 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE ((APPROVER1 != 'na' and APPROVER1 ='{$_settings->userdata('EMPLOYID')}') or (APPROVER1 = 'na' and APPROVER2 ='{$_settings->userdata('EMPLOYID')}') )) and is_inactive = 0) or 
(hr_status = 0 and ($is_operator > 0) and is_inactive = 0) or 
(hr_status = 1 and why1 != '' and sv_status = 0 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE ((APPROVER1 != 'na' and APPROVER1 ='{$_settings->userdata('EMPLOYID')}') or (APPROVER1 = 'na' and APPROVER2 ='{$_settings->userdata('EMPLOYID')}') )) and da_status = 0 and is_inactive = 0) or 
(hr_status = 1 and why1 != '' and sv_status = 1 and `ir_status` = 1 and ($is_operator > 0) and da_status = 0 and quality_violation = 1 and is_inactive = 0) or
(hr_status = 1 and why1 != '' and sv_status = 1 and `ir_status` = 2 and sv_name ='{$_settings->userdata('EMPLOYID')}' and da_status = 2 and is_inactive = 0) 
 ORDER BY `date_created` asc");
                                } else {
                                    if ($_settings->userdata('EMPPOSITION') == 5) {
                                        $ir_da_qry = $conn->query("SELECT * FROM ir_requests WHERE (ir_status = 3  and is_inactive = 0 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE ((APPROVER1 != 'na' and APPROVER1 ='{$_settings->userdata('EMPLOYID')}') or (APPROVER1 = 'na' and APPROVER2 ='{$_settings->userdata('EMPLOYID')}') ))) or 
    (ir_status = 1  and is_inactive = 0 and hr_status = 1 and why1 != '' and sv_status = 0 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE ((APPROVER1 != 'na' and APPROVER1 ='{$_settings->userdata('EMPLOYID')}') or (APPROVER1 = 'na' and APPROVER2 ='{$_settings->userdata('EMPLOYID')}') ))) or
    (hr_status = 1 and why1 != '' and sv_status = 1 and `ir_status` = 1 and da_status = 1 and appeal_status = 2 and ir_status = 1  and is_inactive = 0)
    ORDER BY `date_created` asc");
                                    } elseif ($is_quality > 0) {
                                        $ir_da_qry = $conn->query("SELECT * FROM ir_requests where 
                                (hr_status = 0 and quality_violation = 2  and is_inactive = 0) or
                                (hr_status = 1 and why1 != '' and sv_status = 1 and `ir_status` = 1 and quality_violation = 2 and da_status = 0  and is_inactive = 0) or 
                                (ir_status = 1  and is_inactive = 0 and hr_status = 1 and why1 != '' and sv_status = 0 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE ((APPROVER1 != 'na' and APPROVER1 ='{$_settings->userdata('EMPLOYID')}') or (APPROVER1 = 'na' and APPROVER2 ='{$_settings->userdata('EMPLOYID')}') ))) or
                                (ir_status = 3  and is_inactive = 0 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE ((APPROVER1 != 'na' and APPROVER1 ='{$_settings->userdata('EMPLOYID')}') or (APPROVER1 = 'na' and APPROVER2 ='{$_settings->userdata('EMPLOYID')}') ))) 
                               ORDER BY `date_created` asc");
                                    } else {
                                        $ir_da_qry = $conn->query("SELECT * FROM ir_requests WHERE 
    (ir_status = 1  and is_inactive = 0 and hr_status = 1 and why1 != '' and sv_status = 0 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE ((APPROVER1 != 'na' and APPROVER1 ='{$_settings->userdata('EMPLOYID')}') or (APPROVER1 = 'na' and APPROVER2 ='{$_settings->userdata('EMPLOYID')}') ))) or
     (ir_status = 3  and is_inactive = 0 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE ((APPROVER1 != 'na' and APPROVER1 ='{$_settings->userdata('EMPLOYID')}') or (APPROVER1 = 'na' and APPROVER2 ='{$_settings->userdata('EMPLOYID')}') ))) or 
    (hr_status = 1  and is_inactive = 0 and why1 != '' and sv_status = 1 and  da_status = 1 and appeal_status = 0 and ir_status = 1 and emp_no IN (SELECT EMPLOYID from employee_masterlist WHERE APPROVER2 ='{$_settings->userdata('EMPLOYID')}')) 
        ORDER BY `date_created` desc");
                                    }
                                }

                                // --- 2. Collect all needed EMPLOYID and ir_no values ---
                                $rows = [];
                                $empIDs = [];
                                $irNos = [];
                                while ($row = $ir_da_qry->fetch_assoc()) {
                                    $rows[] = $row;
                                    $empIDs[] = $row['emp_no'];
                                    if (!empty($row['valid_to_da_name'])) $empIDs[] = $row['valid_to_da_name'];
                                    if (!empty($row['valid_appeal_name'])) $empIDs[] = $row['valid_appeal_name'];
                                    if (!empty($row['od_name'])) $empIDs[] = $row['od_name'];
                                    $irNos[] = $row['ir_no'];
                                }
                                $empIDs = array_unique(array_filter($empIDs));
                                $irNos = array_unique(array_filter($irNos));

                                // --- 3. Batch fetch employee data ---
                                $employeeData = [];
                                if (count($empIDs) > 0) {
                                    $empIDList = implode("','", array_map('addslashes', $empIDs));
                                    $empRes = $conn->query("SELECT EMPLOYID, EMPNAME, APPROVER1, APPROVER2, APPROVER3 FROM employee_masterlist WHERE EMPLOYID IN ('$empIDList')");
                                    while ($emp = $empRes->fetch_assoc()) {
                                        $employeeData[$emp['EMPLOYID']] = $emp;
                                    }
                                }

                                // --- 4. Batch fetch IR list data ---
                                $irListData = [];
                                $irListCount = [];
                                $irListViolation = [];
                                if (count($irNos) > 0) {
                                    $irNoList = implode("','", array_map('addslashes', $irNos));
                                    $irRes = $conn->query("SELECT * FROM ir_list WHERE ir_no IN ('$irNoList')");
                                    while ($ir = $irRes->fetch_assoc()) {
                                        $irListData[$ir['ir_no']][] = $ir;
                                        // For count of valid and whole number offense_no
                                        if ($ir['valid'] == 1 && preg_match('/^[0-9]+$/', $ir['offense_no'])) {
                                            if (!isset($irListCount[$ir['ir_no']])) $irListCount[$ir['ir_no']] = 0;
                                            $irListCount[$ir['ir_no']]++;
                                        }
                                        // For violation (assuming all rows for an ir_no have the same violation)
                                        if (!isset($irListViolation[$ir['ir_no']]) && !empty($ir['violation'])) {
                                            $irListViolation[$ir['ir_no']] = $ir['violation'];
                                        }
                                    }
                                }


                                // --- 5. Render table using pre-fetched data ---
                                foreach ($rows as $row):
                                    $approver_1 = $employeeData[$row['emp_no']]['APPROVER1'] ?? null;
                                    $approver_2 = $employeeData[$row['emp_no']]['APPROVER2'] ?? null;
                                    $approver_3 = $employeeData[$row['emp_no']]['APPROVER3'] ?? null;
                                    $approver_1 = ($approver_1 == 'na') ? $approver_2 : $approver_1;
                                    $c = $irListCount[$row['ir_no']] ?? 0;

                                    // Fetch names
                                    $valid_to_da_name = $employeeData[$row['valid_to_da_name']]['EMPNAME'] ?? '';
                                    $valid_appeal_name = $employeeData[$row['valid_appeal_name']]['EMPNAME'] ?? '';
                                    $od_name = $employeeData[$row['od_name']]['EMPNAME'] ?? '';
                                    $reqName = $employeeData[$row['emp_no']]['EMPNAME'] ?? '';

                                    // IR list rows for this IR
                                    $irListRows = $irListData[$row['ir_no']] ?? [];
                                    $violation = $irListViolation[$row['ir_no']] ?? '';

                                    if ($row['has_da'] == 0 && ($row['ir_status'] < 2 || $row['ir_status'] == 3)) {
                                ?>
                                        <tr>
                                            <td class="text-center"><?= $i++; ?></td>
                                            <td class="text-center">
                                                <div class="icheck-primary  d-inline">
                                                    <input class="checkbox" <?= $row['ir_status'] == 1 && $row['sv_status'] == 1  && $row['da_status'] == 1 && ($row['appeal_status'] == 0 || $row['appeal_status'] == 4) ? '' : 'disabled' ?> type="checkbox" id="checkboxPrimary<?= $i ?>" value="<?= $row['id'] ?>" name="iCheck[]">
                                                    <label for="checkboxPrimary<?= $i ?>"></label>
                                                </div>
                                            </td>
                                            <td class="text-center"><?= $row['ir_no'] ?></td>
                                            <td class="text-center"><?= date("m-d-Y h:ia", strtotime($row['date_created'])) ?></td>
                                            <td class="text-center"><?= $reqName ?></td>
                                            <td>
                                                <?php foreach ($irListRows as $rows): ?>
                                                    Code no: <?= $rows['code_no'] ?><br>
                                                    Suspension Date:
                                                    <?php
                                                    $dateString = $rows['date_of_suspension'];
                                                    $dateArray = explode(' + ', $dateString);
                                                    foreach ($dateArray as $key => $date) {
                                                        $trimmedDate = trim($date);
                                                        $timestamp = strtotime($trimmedDate);
                                                        if ($timestamp === false) {
                                                            echo "--";
                                                        } else {
                                                            $dateTime = new DateTime();
                                                            $dateTime->setTimestamp($timestamp);
                                                            $dayOfWeek = $dateTime->format('D');
                                                            echo "Day" . ($key + 1) . " = $trimmedDate ($dayOfWeek)<br>";
                                                        }
                                                    }
                                                    ?>
                                                <?php endforeach; ?>
                                            </td>
                                            <td><?= $violation ?></td>
                                            <td><?= $row['what'] ?></td>
                                            <td class="text-center">
                                                <?php if ($row['ir_status'] == 0) : ?>
                                                    <span class="badge badge-primary rounded-pill">Pending</span>
                                                <?php elseif ($row['ir_status'] == 1 && $row['sv_status'] == 0) : ?>
                                                    <span class="badge badge-secondary rounded-pill">For assessment</span>
                                                <?php elseif ($row['ir_status'] == 1 && $row['sv_status'] == 1  && $row['da_status'] == 1 && $row['appeal_status'] == 1) : ?>
                                                    <span class="badge badge-warning rounded-pill">Appeal validation</span>
                                                <?php elseif ($row['ir_status'] == 1 && $row['sv_status'] == 1  && $row['da_status'] == 1 && $row['appeal_status'] == 2) : ?>
                                                    <span class="badge badge-warning rounded-pill">Director appeal approval</span>
                                                <?php elseif ($row['ir_status'] == 1 && $row['sv_status'] == 1  && $row['da_status'] == 1 && $row['appeal_status'] == 0) : ?>
                                                    <span class="badge badge-warning rounded-pill">IR: For Acknowledgment</span>
                                                <?php elseif ($row['ir_status'] == 1 && $row['sv_status'] == 1  && $row['da_status'] == 0) : ?>
                                                    <span class="badge badge-primary rounded-pill">For Validation</span>
                                                <?php elseif ($row['ir_status'] == 2) : ?>
                                                    <span class="badge badge-success rounded-pill">Approved</span>
                                                <?php elseif ($row['ir_status'] == 3 && $row['da_status'] == 2) : ?>
                                                    Invalid by: <?= $valid_to_da_name ?> <br>
                                                    Reason: <?= $row['disapprove_remarks'] ?>
                                                <?php elseif ($row['ir_status'] == 3 && $row['da_status'] == 2) : ?>
                                                    <span class="badge badge-danger rounded-pill">Disapproved</span>
                                                <?php elseif ($row['ir_status'] == 1 && $row['appeal_status'] == 4) : ?>
                                                    <span class="badge badge-success rounded-pill">IR: For Acknowledgment</span>
                                                <?php elseif ($row['ir_status'] == 1 && $row['appeal_status'] == 3) : ?>
                                                    Invalid by: <?= $valid_appeal_name ?> <br>
                                                    Reason: <?= $row['disapprove_remarks'] ?>
                                                <?php elseif ($row['ir_status'] == 1 && $row['appeal_status'] == 5) : ?>
                                                    Disapproved by: <?= $od_name ?> <br>
                                                    Reason: <?= $row['disapprove_remarks'] ?>
                                                <?php else : ?>
                                                    <span class="badge badge-secondary rounded-pill">Cancelled</span>
                                                <?php endif; ?>
                                            </td>
                                            <td align="center">
                                                <button type="button" class="btn btn-flat btn-default btn-sm dropdown-toggle dropdown-icon" data-toggle="dropdown">
                                                    Action
                                                    <span class="sr-only">Toggle Dropdown</span>
                                                </button>
                                                <div class="dropdown-menu" role="menu">
                                                    <?php if ($row['ir_status'] == 2 && $row['has_da'] == 1) { ?>
                                                        <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/viewDA&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-eye text-dark"></span> Sign DA</a>
                                                    <?php } elseif ($row['ir_status'] == 3 && $row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 2) { ?>
                                                        <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/view_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Edit</a>
                                                    <?php } elseif ($row['ir_status'] == 1 && $row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 0) { ?>
                                                        <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/validate_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> validate</a>
                                                    <?php } else { ?>
                                                        <?php if ($row['hr_status'] == 1 && $row['sv_status'] == 0) { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/view_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Assess</a>
                                                        <?php } elseif ($row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 0 && ($is_operator > 0)) { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/validate_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Sign</a>
                                                        <?php } elseif ($row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 1 && $_settings->userdata('EMPPOSITION') >= 2 && $_settings->userdata('DEPARTMENT') == 'Human Resource') { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/appeal_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Sign</a>
                                                        <?php } elseif ($row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 1 && $_settings->userdata('EMPPOSITION') >= 2 && $_settings->userdata('DEPARTMENT') != 'Human Resource') { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/appeal_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Sign</a>
                                                        <?php } else { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/sign_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Sign</a>
                                                        <?php } ?>
                                                    <?php } ?>
                                                    <?php if ($_settings->userdata('EMPLOYID') == $row['requestor_id'] && $row['emp_no'] == $row['requestor_id'] && $row['ir_status'] == 0) : ?>
                                                        <div class="dropdown-divider"></div>
                                                        <a class="dropdown-item delete_data" href="javascript:void(0)" data-id="<?= $row['id'] ?>"><span class="fa fa-trash text-danger"></span> Cancel</a>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php
                                    } elseif ($row['has_da'] == 1 && $c > 0) {
                                    ?>
                                        <tr>
                                            <td class="text-center"><?= $i++; ?></td>
                                            <td class="text-center">
                                                <div class="icheck-primary d-inline">
                                                    <input class="checkbox" <?= $row['da_status'] == 4 ? '' : 'disabled' ?> type="checkbox" id="checkboxPrimary<?= $i ?>" value="<?= $row['id'] ?>" name="iCheck[]">
                                                    <label for="checkboxPrimary<?= $i ?>"></label>
                                                </div>
                                            </td>
                                            <td class="text-center"><?= $row['ir_no'] ?></td>
                                            <td class="text-center"><?= date("m-d-Y h:ia", strtotime($row['date_created'])) ?></td>
                                            <td class="text-center"><?= $reqName ?></td>
                                            <td>
                                                <?php foreach ($irListRows as $rows): ?>
                                                    Code no: <?= $rows['code_no'] ?><br>
                                                    Suspension Date:
                                                    <?php
                                                    $dateString = $rows['date_of_suspension'];
                                                    $dateArray = explode(' + ', $dateString);
                                                    foreach ($dateArray as $key => $date) {
                                                        $trimmedDate = trim($date);
                                                        $timestamp = strtotime($trimmedDate);
                                                        if ($timestamp === false) {
                                                            echo "--";
                                                        } else {
                                                            $dateTime = new DateTime();
                                                            $dateTime->setTimestamp($timestamp);
                                                            $dayOfWeek = $dateTime->format('D');
                                                            echo "Day" . ($key + 1) . " = $trimmedDate ($dayOfWeek)<br>";
                                                        }
                                                    }
                                                    ?>
                                                <?php endforeach; ?>
                                            </td>
                                            <td><?= $violation ?></td>

                                            <td><?= $row['what'] ?></td>
                                            <td class="text-center">
                                                <?php if ($row['da_status'] == 1) : ?>
                                                    <span class="badge badge-primary rounded-pill">For HR Manager</span>
                                                <?php elseif ($row['da_status'] == 2 && $approver_1 != $approver_3) : ?>
                                                    <span class="badge badge-secondary rounded-pill">DA: For Supervisor</span>
                                                <?php elseif ($row['da_status'] == 3 || ($row['da_status'] == 2 && $approver_1 == $approver_3)) : ?>
                                                    <span class="badge badge-secondary rounded-pill">DA: For Department manager</span>
                                                <?php elseif ($row['da_status'] == 4) : ?>
                                                    <span class="badge badge-primary rounded-pill">IR: For Acknowledgment</span>
                                                <?php elseif ($row['da_status'] == 5) : ?>
                                                    <span class="badge badge-success rounded-pill">Approved</span>
                                                <?php else : ?>
                                                    <span class="badge badge-secondary rounded-pill">--</span>
                                                <?php endif; ?>
                                            </td>
                                            <td align="center">
                                                <button type="button" class="btn btn-flat btn-default btn-sm dropdown-toggle dropdown-icon" data-toggle="dropdown">
                                                    Action
                                                    <span class="sr-only">Toggle Dropdown</span>
                                                </button>
                                                <div class="dropdown-menu" role="menu">
                                                    <?php if ($row['ir_status'] == 2 && $row['has_da'] == 1) { ?>
                                                        <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/viewDA&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-eye text-dark"></span> Sign DA</a>
                                                    <?php } elseif ($row['ir_status'] == 3 && $row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 2) { ?>
                                                        <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/view_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Edit</a>
                                                    <?php } elseif ($row['ir_status'] == 1 && $row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 0) { ?>
                                                        <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/validate_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Edit</a>
                                                    <?php } else { ?>
                                                        <?php if ($row['hr_status'] == 1 && $row['sv_status'] == 0 && $row['sv_name'] == $_settings->userdata('EMPLOYID')) { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/view_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Assess</a>
                                                        <?php } elseif ($row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 0 && ($is_operator > 0)) { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/validate_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Sign</a>
                                                        <?php } elseif ($row['hr_status'] == 1 && $row['sv_status'] == 1 && $row['da_status'] == 1 && $_settings->userdata('EMPPOSITION') >= 2) { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/view_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Sign</a>
                                                        <?php } else { ?>
                                                            <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/sign_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Sign</a>
                                                        <?php } ?>
                                                    <?php } ?>
                                                    <?php if ($_settings->userdata('EMPLOYID') == $row['requestor_id'] && $row['emp_no'] == $row['requestor_id'] && $row['ir_status'] == 0) : ?>
                                                        <div class="dropdown-divider"></div>
                                                        <a class="dropdown-item delete_data" href="javascript:void(0)" data-id="<?= $row['id'] ?>"><span class="fa fa-trash text-danger"></span> Cancel</a>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php
                                    } elseif ($row['has_da'] == 0 && $row['ir_status'] == 2 && $c > 0) {
                                    ?>
                                        <tr>
                                            <td class="text-center"><?= $i++; ?></td>
                                            <td class="text-center">
                                                <div class="icheck-primary d-inline">
                                                    <input class="checkbox" disabled type="checkbox" id="checkboxPrimary<?= $i ?>" value="<?= $row['id'] ?>" name="iCheck[]">
                                                    <label for="checkboxPrimary<?= $i ?>"></label>
                                                </div>
                                            </td>
                                            <td class="text-center"><?= $row['ir_no'] ?></td>
                                            <td class="text-center"><?= date("m-d-Y h:ia", strtotime($row['date_created'])) ?></td>
                                            <td class="text-center"><?= $reqName ?></td>
                                            <td>
                                                <?php foreach ($irListRows as $rows): ?>
                                                    Code no: <?= $rows['code_no'] ?><br>
                                                    Suspension Date:
                                                    <?php
                                                    $dateString = $rows['date_of_suspension'];
                                                    $dateArray = explode(' + ', $dateString);
                                                    foreach ($dateArray as $key => $date) {
                                                        $trimmedDate = trim($date);
                                                        $timestamp = strtotime($trimmedDate);
                                                        if ($timestamp === false) {
                                                            echo "--";
                                                        } else {
                                                            $dateTime = new DateTime();
                                                            $dateTime->setTimestamp($timestamp);
                                                            $dayOfWeek = $dateTime->format('D');
                                                            echo "Day" . ($key + 1) . " = $trimmedDate ($dayOfWeek)<br>";
                                                        }
                                                    }
                                                    ?>
                                                <?php endforeach; ?>
                                            </td>
                                            <td><?= $violation ?></td>
                                            <td><?= $row['what'] ?></td>
                                            <td class="text-center">
                                                <?php if ($row['has_da'] == 0) : ?>
                                                    <span class="badge badge-danger rounded-pill">For DA</span>
                                                <?php elseif ($row['da_status'] == 1) : ?>
                                                    <span class="badge badge-warning rounded-pill">For HR Manager</span>
                                                <?php elseif ($row['da_status'] == 2) : ?>
                                                    <span class="badge badge-primary rounded-pill">For immediate superior</span>
                                                <?php elseif ($row['da_status'] == 3) : ?>
                                                    <span class="badge badge-secondary rounded-pill">DA: For Department manager</span>
                                                <?php elseif ($row['da_status'] == 4) : ?>
                                                    <span class="badge badge-danger rounded-pill">For Acknowledgement</span>
                                                <?php elseif ($row['da_status'] == 4) : ?>
                                                    <span class="badge badge-success rounded-pill">Acknowledged</span>
                                                <?php else : ?>
                                                    <span class="badge badge-secondary rounded-pill">Cancelled</span>
                                                <?php endif; ?>
                                            </td>
                                            <td align="center">
                                                <button type="button" class="btn btn-flat btn-default btn-sm dropdown-toggle dropdown-icon" data-toggle="dropdown">
                                                    Action
                                                    <span class="sr-only">Toggle Dropdown</span>
                                                </button>
                                                <div class="dropdown-menu" role="menu">
                                                    <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/validate_ir&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-eye text-dark"></span> View IR</a>
                                                    <div class="dropdown-divider"></div>
                                                    <a class="dropdown-item" href="<?= base_url . 'admin?page=incidentreport/approveIR/new_da&id=' . md5($row['id']) ?>" data-id="<?= $row['id'] ?>"><span class="fa fa-pen text-dark"></span> Issue D.A</a>
                                                    <?php if ($_settings->userdata('EMPLOYID') == $row['requestor_id'] && $row['emp_no'] == $row['requestor_id'] && $row['ir_status'] == 0) : ?>
                                                        <div class="dropdown-divider"></div>
                                                        <a class="dropdown-item delete_data" href="javascript:void(0)" data-id="<?= $row['id'] ?>"><span class="fa fa-trash text-danger"></span> Cancel</a>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                        </tr>
                                <?php
                                    }
                                endforeach;
                                ?>
                            </tbody>
                        </table>
                    </form>
                </div>
            </div>
            <div class="tab-pane fade" id="custom-tabs-one-history" role="tabpanel" aria-labelledby="custom-tabs-one-history-tab">
                <!-- kukunin yung history ng IR approvals mabagal kasi kapag nilagay sa main page kaya may ganto nasa ajax ang function ng pag load -->
                <div id="index_history">Please wait...</div>
            </div>
        </div>
    </div>
</div>
<script>
    $(document).ready(function() {
        $('#selectAllButton').click(function() {
            // Toggle the state of all checkboxes
            let btnTxt = $(this).find('.btn-text')
            if (btnTxt.text() === 'Select All') {
                $('.checkbox:not(:disabled)').prop('checked', true);
                btnTxt.text('Unselect All')
            } else {
                $('.checkbox').prop('checked', false);
                btnTxt.text('Select All')
            }
        });
        $('.delete_data').click(function() {
            _conf("Are you sure to cancel this incident report?", "delete_po", [$(this).attr('data-id')])
        })
        $('.issue_da').click(function() {
            uni_modal("Are you sure to issue disciplinary action on this incident report?", "incidentreport/createNewIRDA/new_da.php?id=" + $(this).attr('data-id'), 'mid-large')
        })
        $('.export_list').click(function() {
            uni_modal("", "incidentreport/createNewIRDA/export_data.php", 'mid-large')
        })
        $('.table td,.table th').addClass('py-1 px-2 align-middle')
        $('.table').dataTable();

        // custom-tabs-one-history
        $.ajax({
            url: _base_url_ + "admin/incidentReport/approveIR/history_index_ir.php",
            method: "POST",
            success: function(response) {
                $("#index_history").html(response);
                end_loader();
            },
            error: function(error) {
                console.log("Error:", error);
            }
        });
    })

    function delete_po($id) {
        start_loader();
        $.ajax({
            url: _base_url_ + "classes/Master.php?f=ir_cancel",
            method: "POST",
            data: {
                id: $id
            },
            dataType: "json",
            error: err => {
                console.log(err)
                alert_toast("An error occured.", 'error');
                end_loader();
            },
            success: function(resp) {
                if (typeof resp == 'object' && resp.status == 'success') {
                    location.reload();
                } else {
                    alert_toast("An error occured.", 'error');
                    end_loader();
                }
            }
        })
    }
    $('#irda-form').submit(function(e) {
        e.preventDefault();
        messageType = 2;
        var _this = $(this)

        // Retrieve the value of the clicked button (either 'approve' or 'disapprove')
        var action = $("button[type=submit][clicked=true]").val();

        $('.err-msg').remove();
        start_loader();

        // Include 'action' in the data sent via AJAX
        var formData = new FormData($(this)[0]);
        formData.append('action', action);

        $.ajax({
            url: _base_url_ + "classes/IR_DA_Master.php?f=sign_ir_checkall",
            data: new FormData($(this)[0]),
            cache: false,
            contentType: false,
            processData: false,
            data: formData,
            method: 'POST',
            type: 'POST',
            dataType: 'json',
            error: err => {
                console.log(err)
                alert_toast("An error occured", 'error');
                end_loader();
            },
            success: function(resp) {
                if (resp.status == 'success') {
                    location.reload();
                } else if (resp.status == 'failed' && !!resp.msg) {
                    var el = $('<div>')
                    el.addClass("alert alert-danger err-msg").text(resp.msg)
                    _this.prepend(el)
                    el.show('slow')
                    end_loader()
                } else {
                    alert_toast("Please check the boxes!", 'warning');
                    end_loader();
                    console.log(resp)
                }
                $('html,body').animate({
                    scrollTop: 0
                }, 'fast')
            }
        })
    })
</script>