<?php
if (isset($_GET['id']) && $_GET['id'] > 0) {
    $qry = $conn->query("SELECT * from `ir_requests` where md5(id) = '{$_GET['id']}' ");
    if ($qry->num_rows > 0) {
        foreach ($qry->fetch_assoc() as $k => $v) {
            $$k = $v;
        }
    }
}
$control_no = $conn->query("SELECT * FROM ir_requests")->num_rows;


$e_id = $_settings->userdata('EMPLOYID');
?>
<style>
    input.form-control:read-only {
        background-color: #fff;
    }

    select.custom-select:disabled {
        background-color: #fff;

    }

    textarea.form-control:read-only {
        background-color: #fff;
    }

    /* 
    #uni_modal .modal-footer,
    .modal-footer {
        display: none;
    } */
</style>
<noscript>
    <style>
        .page-break {
            page-break-before: always;
        }

        select.custom-select:disabled {
            background-color: #fff;
        }

        input.form-control:read-only {
            background-color: #fff;
        }

        textarea.form-control:read-only {
            background-color: #fff;
        }
    </style>
</noscript>
<div class="card card-outline card-primary">

    <div class="card-body">
        <form action="" id="ir-form">
            <input readonly type="hidden" name="id" value="<?php echo isset($id)  ? $id : '' ?>">
            <input readonly type="hidden" name="requestor_id" value="<?php echo $_settings->userdata('EMPLOYID') ?>">
            <div class="container-fluid">
                <div class="printable">
                    <div class="row" style="margin-left: 1%;">
                        <p class="MsoNormal" align="left" style="margin: 0cm; text-indent: 0cm; line-height: 107%; background: rgb(153, 51, 0);"><b><span style="font-size:24.0pt;line-height:107%;color:white">T
                                    E L F O R D</span></b>
                            <o:p></o:p>
                        </p>
                    </div>
                    <p class="MsoNormal" align="left"><b><span style="margin-left: 1%;font-size:11.5pt;line-height:107%">TELFORD
                                SVC. PHILS., INC.</span>
                        </b>
                        <o:p></o:p>
                    </p>
                    <h4 class="text-center"><strong>NOTICE OF DISCIPLINARY ACTION</strong></h4>

                    <div class="form-group justify-content-end row">
                        <label class=" col-form-label text-info">IR No.</label>
                        <div class="col-sm-3">
                            <input readonly type="text" class="form-control rounded-0 text-inline" id="ir_no" name="ir_no" value="<?php echo isset($ir_no) ? $ir_no :  date('Y') . '-' . sprintf("%03d", $control_no + 1) ?>">
                        </div>
                    </div>
                    <div class="form-group justify-content-end row">
                        <label class=" col-form-label text-info">Date</label>
                        <div class="col-sm-3">
                            <input readonly type="text" class="form-control  rounded-0" class="form-control  rounded-0" value="<?php echo isset($date_created)  ? date('m/d/Y', strtotime($date_created)) : date('Y-m-d') ?>">

                        </div>
                    </div>
                    <div class="row">
                        <div class="col-6">
                            <label class="control-label text-info">Employee no</label>
                            <input required type="number" name="emp_no" id="emp_no" class="form-control  rounded-0" readonly value="<?php echo isset($emp_no) ? $emp_no : '' ?>">
                        </div>
                        <div class="col-6">
                            <label class="control-label text-info">Shift/Team</label>
                            <input required type="text" name="shift" readonly id="shift" class="form-control  rounded-0" value="<?php echo isset($shift) ? $shift : '' ?>">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-6">
                            <label class="control-label text-info">Employee name</label>
                            <input required readonly type="text" name="emp_name" id="emp_name" class="form-control  rounded-0" value="<?php echo isset($emp_name)  ? $emp_name : '' ?>">
                        </div>
                        <div class="col-6">
                            <label class="control-label text-info">Position</label>
                            <input required type="text" readonly name="position" id="position" class="form-control  rounded-0" value="<?php echo isset($position)  ? $position : '' ?>">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-4">
                            <label class="control-label text-info">Department</label>
                            <input required readonly type="text" name="department" id="department" class="form-control  rounded-0" value="<?php echo isset($department)  ? $department : '' ?>">
                        </div>
                        <div class="col-4">
                            <label class="control-label text-info">Station</label>
                            <input required readonly type="text" name="station" id="station" class="form-control  rounded-0" value="<?php echo isset($station)  ? $station : '' ?>">
                        </div>
                        <div class="col-4">
                            <label class="control-label text-info">Product line</label>
                            <input required type="text" readonly name="productline" id="productline" class="form-control rounded-0" value="<?php echo isset($productline)  ? $productline : '' ?>">
                        </div>
                    </div>
                    <br class="dont_">
                    <h5 class="dont_"><i>Cleansing period</i></h5>
                    <br class="dont_">
                    <div class="row text-center dont_">
                        <div class="col-2">
                            <div class="callout callout-default">
                                <b> Verbal Warning<br><i>6 Months </i></b>
                            </div>
                        </div>
                        <div class="col-2">
                            <div class="callout callout-success">
                                <b> Written Warning<br><i>9 Months </i></b>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="callout callout-info">
                                <b> 3 Days Suspension<br><i>12 Months </i></b>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="callout callout-warning">
                                <b> 7 Days Suspension<br><i>18 Months </i></b>
                            </div>
                        </div>
                        <div class="col-2">
                            <div class="callout callout-danger">
                                <b> Dismissal<br><i> -- </i> </b>
                            </div>
                        </div>
                    </div>
                    <br>
                    <h5><i>Violations based on company code of conduct</i></h5>
                    <br>
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th class="text-center py-1 px-2">Code no.</th>
                                <th class="text-center py-1 px-2">Violation/Nature of offenses</th>
                                <th class="text-center py-1 px-2">D.A</th>
                                <th class="text-center py-1 px-2">Date committed</th>
                                <th class="text-center py-1 px-2">No. of offense</th>
                                <th class="text-center py-1 px-2">Schedule of suspension</th>
                                <th class="text-center py-1 px-2">Cleansing Date</th>

                            </tr>
                        </thead>
                        <?php if ($appeal_status != 4) { ?>
                            <tbody>
                                <?php
                                $options = $conn->query("SELECT * FROM `ir_list` where `ir_no` = '$ir_no' and valid = 1");
                                while ($row = $options->fetch_assoc()) :
                                ?>
                                    <tr class="text-center">
                                        <td><?php echo $row['code_no'] ?></td>
                                        <td><?php echo $row['violation'] ?></td>
                                        <td class="text-center">
                                            <?php if ($row['da_type'] == 1) : ?>
                                                <span class="badge badge-success rounded-pill">Verbal Warning</span>
                                            <?php elseif ($row['da_type'] == 2) : ?>
                                                <span class="badge badge-primary rounded-pill">Written Warning</span>
                                            <?php elseif ($row['da_type'] == 3) : ?>
                                                <span class="badge badge-secondary rounded-pill">3 Days Suspension</span>
                                            <?php elseif ($row['da_type'] == 4) : ?>
                                                <span class="badge badge-warning rounded-pill">7 Days Suspension</span>
                                            <?php elseif ($row['da_type'] == 5) : ?>
                                                <span class="badge badge-danger rounded-pill">Dismissal</span>
                                            <?php elseif ($row['da_type'] == 6) : ?>
                                                <span class="badge badge-danger rounded-pill">14 Days Suspension</span>
                                            <?php endif; ?>
                                        </td>
                                        <td class="text-center">
                                            <?php
                                            $dateString = $row['date_commited'];
                                            $dateArray = explode(' + ', $dateString);

                                            foreach ($dateArray as $key => $date) {
                                                $trimmedDate = trim($date);
                                                $timestamp = strtotime($trimmedDate);

                                                if ($timestamp === false) {
                                                    echo "Error parsing date: $trimmedDate <br>";
                                                } else {
                                                    $dateTime = new DateTime();
                                                    $dateTime->setTimestamp($timestamp);

                                                    $dayOfWeek = $dateTime->format('D');
                                                    echo "Day" . ($key + 1) . " = $trimmedDate ($dayOfWeek)<br>";
                                                }
                                            }

                                            ?>
                                        </td>
                                        <td><?php echo $row['offense_no'] ?></td>

                                        <?php if ($row['da_type'] == 3 || $row['da_type'] == 4 || $row['da_type'] == 6) : ?>
                                            <td class="text-center">
                                                <?php
                                                $dateString = trim($row['date_of_suspension']);
                                                if (!empty($dateString)) {
                                                    $dateArray = explode(' + ', $dateString);
                                                    foreach ($dateArray as $key => $date) {
                                                        $dateTime = DateTime::createFromFormat('m/d/Y', $date);
                                                        if ($dateTime) {
                                                            $dayOfWeek = $dateTime->format('D');
                                                            echo "Day" . ($key + 1) . " = $date ($dayOfWeek)<br>";
                                                        }
                                                    }
                                                } else {
                                                    echo "<span>No date of suspension</span>";
                                                }
                                                ?>
                                            </td>
                                        <?php else : ?>
                                            <td class="text-center">
                                                <span>No date of suspension</span>
                                            </td>
                                        <?php endif; ?>

                                        <td class="text-center">
                                            <?php
                                            $str = $row['code_no'];

                                            // Use regular expression to find the first letter
                                            preg_match('/[a-zA-Z]/', $str, $matches);

                                            $firstLetter = $matches[0];
                                            $dateString1 = $row['date_commited'];
                                            $dateArray1 = explode(' + ', $dateString1);

                                            $originalDate = $dateArray1[0];
                                            $daType = $row['da_type'];

                                            if ($firstLetter == 'A') {
                                                $adjustedDate = strtotime("+6 months", strtotime($originalDate));
                                            } elseif ($firstLetter == 'B') {
                                                $adjustedDate = strtotime("+9 months", strtotime($originalDate));
                                            } elseif ($firstLetter == 'C') {
                                                $adjustedDate = strtotime("+12 months", strtotime($originalDate));
                                            } elseif ($firstLetter == 'D') {
                                                $adjustedDate = strtotime("+18 months", strtotime($originalDate));
                                            } else {
                                                $adjustedDate = strtotime($originalDate);
                                            }
                                            if ($firstLetter != 'E') {
                                                $newDate = date("m-d-Y", $adjustedDate);
                                                echo $newDate;
                                            } else {
                                                echo '--';
                                            }
                                            ?>
                                        </td>
                                        <!-- <td class="dont_">
                                        <a class="btn btn-sm btn-block edt" href="javascript:void(0)" data-id="<?php echo $row['id'] ?>"><span class="fas fa-pencil-alt"></span></a>
                                    </td> -->
                                    </tr>

                                <?php endwhile; ?>
                                <?php
                                $totalSum = $conn->query("SELECT sum(days_no) FROM `ir_list` WHERE `ir_no` = '$ir_no' and valid = 1 and (da_type = 3 or da_type = 4)")->fetch_array()[0];
                                ?>
                                <tr>
                                    <td colspan="6" class="text-right">TOTAL NO. OF DAYS(if suspension):</td>
                                    <td>
                                        <input readonly type="text" class="form-control text-center form-control-border" value="<?php echo isset($totalSum) ? $totalSum : 0 . ' Day/s' ?>">
                                    </td>
                                </tr>

                            </tbody>
                        <?php } elseif ($appeal_status == 4) { ?>
                            <tbody>
                                <?php
                                $options = $conn->query("SELECT * FROM `ir_list` where `ir_no` = '$ir_no' and valid = 1");
                                while ($row = $options->fetch_assoc()) :
                                ?>
                                    <tr class="text-center">
                                        <td><?php echo $row['code_no'] ?></td>
                                        <td><?php echo $row['violation'] ?></td>
                                        <td class="text-center">
                                            <?php if (empty($row['appeal_da_type'])) { ?>
                                                <?php if ($row['da_type'] == 1) : ?>
                                                    <span class="badge badge-success rounded-pill">Verbal Warning</span>
                                                <?php elseif ($row['da_type'] == 2) : ?>
                                                    <span class="badge badge-primary rounded-pill">Written Warning</span>
                                                <?php elseif ($row['da_type'] == 3) : ?>
                                                    <span class="badge badge-secondary rounded-pill">3 Days Suspension</span>
                                                <?php elseif ($row['da_type'] == 4) : ?>
                                                    <span class="badge badge-warning rounded-pill">7 Days Suspension</span>
                                                <?php elseif ($row['da_type'] == 5) : ?>
                                                    <span class="badge badge-danger rounded-pill">Dismissal</span>
                                                <?php elseif ($row['da_type'] == 6) : ?>
                                                    <span class="badge badge-danger rounded-pill">14 Days Suspension</span>
                                                <?php endif; ?>
                                            <?php } else { ?>
                                                <?php if ($row['appeal_da_type'] == 1) : ?>
                                                    <span class="badge badge-success rounded-pill">Verbal Warning</span>
                                                <?php elseif ($row['appeal_da_type'] == 2) : ?>
                                                    <span class="badge badge-primary rounded-pill">Written Warning</span>
                                                <?php elseif ($row['appeal_da_type'] == 3) : ?>
                                                    <span class="badge badge-secondary rounded-pill">3 Days Suspension</span>
                                                <?php elseif ($row['appeal_da_type'] == 4) : ?>
                                                    <span class="badge badge-warning rounded-pill">7 Days Suspension</span>
                                                <?php elseif ($row['appeal_da_type'] == 5) : ?>
                                                    <span class="badge badge-danger rounded-pill">Dismissal</span>
                                                <?php elseif ($row['appeal_da_type'] == 6) : ?>
                                                    <span class="badge badge-danger rounded-pill">14 Days Suspension</span>
                                                <?php endif; ?>
                                            <?php } ?>
                                        </td>
                                        <td class="text-center">
                                            <?php
                                            $dateString = $row['date_commited'];
                                            $dateArray = explode(' + ', $dateString);

                                            foreach ($dateArray as $key => $date) {
                                                $trimmedDate = trim($date);
                                                $timestamp = strtotime($trimmedDate);

                                                if ($timestamp === false) {
                                                    echo "Error parsing date: $trimmedDate <br>";
                                                } else {
                                                    $dateTime = new DateTime();
                                                    $dateTime->setTimestamp($timestamp);

                                                    $dayOfWeek = $dateTime->format('D');
                                                    echo "Day" . ($key + 1) . " = $trimmedDate ($dayOfWeek)<br>";
                                                }
                                            }

                                            ?>
                                        </td>
                                        <td><?php echo $row['offense_no'] ?></td>

                                        <?php if (empty($row['appeal_da_type'])) { ?>

                                            <?php if ($row['da_type'] == 3 || $row['da_type'] == 4 || $row['da_type'] == 6) : ?>
                                                <td class="text-center">
                                                    <?php
                                                    $dateArray = explode(' + ', trim($row['appeal_date']));

                                                    foreach ($dateArray as $key => $date) {
                                                        $dateTime = DateTime::createFromFormat('m/d/Y', $date);
                                                        $dayOfWeek = $dateTime->format('D');

                                                        echo "Day" . ($key + 1) . " = $date ($dayOfWeek)<br>";
                                                    }

                                                    ?>
                                                </td>
                                            <?php else : ?>
                                                <td>
                                                    <span>--</span>
                                                </td>
                                            <?php endif; ?>
                                        <?php } else { ?>
                                            <?php if ($row['appeal_da_type'] == 3 || $row['appeal_da_type'] == 4 || $row['appeal_da_type'] == 6) : ?>
                                                <td class="text-center">
                                                    <?php
                                                    $dateArray = explode(' + ', trim($row['appeal_date']));

                                                    foreach ($dateArray as $key => $date) {
                                                        $dateTime = DateTime::createFromFormat('m/d/Y', $date);
                                                        $dayOfWeek = $dateTime->format('D');

                                                        echo "Day" . ($key + 1) . " = $date ($dayOfWeek)<br>";
                                                    }

                                                    ?>
                                                </td>
                                            <?php else : ?>
                                                <td>
                                                    <span>--</span>
                                                </td>
                                            <?php endif; ?>
                                        <?php }  ?>
                                        </td>
                                        <td class="text-center">
                                            <?php
                                            $str = $row['code_no'];

                                            // Use regular expression to find the first letter
                                            preg_match('/[a-zA-Z]/', $str, $matches);

                                            $firstLetter = $matches[0];
                                            $dateString1 = $row['date_commited'];
                                            $dateArray1 = explode(' + ', $dateString1);

                                            $originalDate = $dateArray1[0];
                                            $daType = $row['da_type'];

                                            if ($firstLetter == 'A') {
                                                $adjustedDate = strtotime($originalDate . "+6 months");
                                            } elseif ($firstLetter == 'B') {
                                                $adjustedDate = strtotime($originalDate . "+9 months");
                                            } elseif ($firstLetter == 'C') {
                                                $adjustedDate = strtotime($originalDate . "+12 months");
                                            } elseif ($firstLetter == 'D') {
                                                $adjustedDate = strtotime($originalDate . "+18 months");
                                            } else {
                                                // Handle other cases or set a default date
                                                $adjustedDate = strtotime($originalDate);
                                            }
                                            if ($firstLetter != 'E') {
                                                $newDate = date("m-d-Y", $adjustedDate);
                                                echo $newDate;
                                            } else {
                                                echo '--';
                                            }
                                            ?>
                                        </td>
                                        <!-- <td class="dont_">
                                        <a class="btn btn-sm btn-block edt" href="javascript:void(0)" data-id="<?php echo $row['id'] ?>"><span class="fas fa-pencil-alt"></span></a>
                                    </td> -->
                                    </tr>

                                <?php endwhile; ?>
                                <?php
                                $totalSum = $conn->query("SELECT sum(appeal_days) FROM `ir_list` WHERE `ir_no` = '$ir_no'and (da_type = 3 or da_type = 4)")->fetch_array()[0];
                                ?>
                                <tr>
                                    <td colspan="6" class="text-right">TOTAL NO. OF DAYS(if suspension):</td>
                                    <td>
                                        <input readonly type="text" class="form-control text-center form-control-border" value="<?php echo isset($totalSum) ? $totalSum : 0 . ' Day/s' ?>">
                                    </td>
                                </tr>

                            </tbody>
                        <?php } ?>
                    </table>
                    <br class="dont_">

                    <br class="dont_">
                    <h4 class="text-center"><strong>COMMITMENT LETTER</strong></h4>

                    <p align="justify" style="font-size: large;">
                        I, <u><i><?php echo $emp_name ?></i></u>, understand the seriousness of my actions and
                        the potential consequences that may arise from such violations. I want to assure you that I take
                        full responsibility for my behavior and am committed to rectifying the situation.
                        Moving forward, I pledge to adhere to all rules, policies, and guidelines set forth the company
                        (Telford Svc. Phils. Inc). <br>
                        <small>
                            <i>
                                (Ako <?php echo $emp_name ?>, ay nauunawaan ang kahalagahan ng aking mga kilos at
                                ang posibleng mga kahihinatnan na maaaring maging bunga ng aking mga paglabag. Nais kong tiyakin
                                sa inyo na ako'y lubos na nagmamalasakit sa aking pag-uugali at determinadong ituwid ang sitwasyon.
                                Sa paglipas ng panahon, ako'y sumusumpang sumunod sa lahat ng mga alituntunin, patakaran,
                                at mga patnubay na itinakda ng kumpanya (Telford Svc. Phils. Inc).
                                )
                            </i>
                        </small>
                    </p>
                    <br class="dont_">
                    <div class="row">
                        <div class="col-12">

                            <!-- <label class="control-label text-info">Others:</label>
                            <textarea type="text" readonly name="da_others" class="form-control rounded-0"><?php echo isset($da_others)  ? $da_others : '' ?></textarea> -->
                        </div>
                    </div>
                    <hr>
                    <br>
                    <div class="row justify-content-center">
                        <div class="col-6 text-center">
                            <?php if ($acknowledge_da == 0 && $_settings->userdata('EMPLOYID') == $emp_no) { ?>
                                <a href="javascript:void(0)" class="btn btn-block btn-success ack_data" data-id="<?php echo $id ?>" data-sign="5" data-emp="<?php echo $emp_no ?>">Acknowledge</a>
                            <?php } else { ?>
                                <input readonly type="text" class="form-control  rounded-0" placeholder="For acknowledgement." style="border: 0; border-bottom: 1px solid black; text-align:center" class="form-control  rounded-0" value="<?php echo  isset($acknowledge_date) ? $emp_name . ' / ' . date('m-d-Y', strtotime($acknowledge_date)) : '' ?>">
                                <label class="control-label  text-info">Employee's name / date</label>
                            <?php } ?>
                        </div>
                    </div>
                    <br>
                    <div class="row justify-content-between">
                        <div class="col-5">
                            <label class="control-label  text-info">Issued to: </label>
                            <input readonly required type="text" class="form-control  rounded-0" name="da_requestor_name" class="form-control  rounded-0" value="<?php echo isset($emp_name)  ? $emp_name :  '' ?>">
                            <i class="text-info" style="display:block; text-align: center;">Name</i>
                        </div>
                        <div class="col-4">
                            <label class="control-label  text-info">Date </label>
                            <input readonly required type="text" name="da_requested_date" class="form-control  rounded-0" class="form-control  rounded-0" value="<?php echo date('m/d/Y h:i a', strtotime($valid_to_da_date)) ?>">

                        </div>
                    </div>
                    <div class="row justify-content-between">
                        <?php if ($da_status >= 1) {
                            $noted_by = $conn->query("SELECT EMPNAME FROM employee_masterlist WHERE EMPLOYID = $valid_to_da_name")->fetch_array()[0];
                        ?>
                            <div class="col-5">
                                <label class="control-label text-info"><?php echo isset($da_status) && $da_status >= 1 ? 'Issued' : '' ?> by :</label>
                                <input readonly type="text" class="form-control" value="<?php echo isset($noted_by)  ? $noted_by : '' ?>">
                                <i class="text-info" style="display:block; text-align: center;">HR Personnel</i>
                            </div>
                            <div class="col-4">
                                <label class="control-label text-info">Date:</label>
                                <input readonly type="text" class="form-control rounded-0" class="form-control form-control-sm rounded-0" value="<?php echo isset($valid_to_da_date)  ? date('m/d/Y h:i a', strtotime($valid_to_da_date)) : '' ?>">
                            </div>
                        <?php } ?>
                    </div>

                    <div class="row justify-content-between">
                        <?php if ($da_status >= 2) {
                            $hr_mngr_name = $conn->query("SELECT EMPNAME FROM employee_masterlist WHERE EMPLOYID = $hr_mngr")->fetch_array();
                        ?>
                            <div class="col-5">
                                <label class="control-label text-info"><?php echo isset($da_status) && $da_status >= 2 ? 'Acknowledge' : '' ?> by :</label>
                                <input readonly type="text" class="form-control" id="sv_name" value="<?php echo isset($hr_mngr_name[0])  ? $hr_mngr_name[0] : '' ?>">
                                <i class="text-info" style="display:block; text-align: center;">HR Manager</i>
                            </div>
                            <div class="col-4">
                                <label class="control-label text-info">Date:</label>
                                <input readonly type="text" class="form-control rounded-0" class="form-control form-control-sm rounded-0" value="<?php echo isset($hr_mngr_sign_date)  ? date('m/d/Y h:i a', strtotime($hr_mngr_sign_date)) : '' ?>">
                            </div>
                        <?php } else { ?>
                            <div class="col-5">
                                <label class="control-label  text-info">For acknowledgement : </label>
                                <input readonly type="text" class="form-control" placeholder="Human Resource Manager" value="">
                                <i class="text-info" style="display:block; text-align: center;">HR Manager</i>
                            </div>
                            <div class="col-4">
                                <label class="control-label  text-info">Date </label>
                                <input readonly required type="date" class="form-control  rounded-0" name="hr_mngr_sign_date" class="form-control  rounded-0" value="<?php echo isset($hr_mngr_sign_date)  ? date('Y/m/d', strtotime($hr_mngr_sign_date)) : date('Y-m-d') ?>">

                            </div>
                        <?php } ?>
                    </div>
                    <div class="row justify-content-between">
                        <?php if ($da_status >= 3) {
                            $appr_by = $conn->query("SELECT EMPNAME FROM employee_masterlist WHERE EMPLOYID = $sv_name")->fetch_array()[0];
                        ?>
                            <div class="col-5">
                                <label class="control-label text-info"><?php echo isset($da_status) && $da_status >= 3 ? 'Acknowledge' : '' ?> by :</label>
                                <input readonly type="text" class="form-control" id="sv_name" value="<?php echo isset($appr_by)  ? $appr_by : '' ?>">
                                <i class="text-info" style="display:block; text-align: center;">Approver 1</i>
                            </div>
                            <div class="col-4">
                                <label class="control-label text-info">Date:</label>
                                <input readonly type="text" class="form-control rounded-0" class="form-control form-control-sm rounded-0" value="<?php echo isset($sv_da_sign_date)  ? date('m/d/Y h:i a', strtotime($sv_da_sign_date)) : date('m/d/Y h:i a', strtotime($dh_da_sign_date)) ?>">
                            </div>
                        <?php } else { ?>
                            <div class="col-5">
                                <label class="control-label  text-info">For Acknowledgement : </label>
                                <input readonly type="text" class="form-control" placeholder="Immediate superior" id="dh_name" value="">
                                <i class="text-info" style="display:block; text-align: center;">Approver 1</i>
                            </div>
                            <div class="col-4">
                                <label class="control-label  text-info">Date </label>
                                <input readonly required type="date" class="form-control  rounded-0" name="sv_sign_date" class="form-control  rounded-0" value="">

                            </div>
                        <?php } ?>
                    </div>
                    <div class="row justify-content-between">
                        <?php if ($da_status >= 4) {
                            $mngr = $conn->query("SELECT EMPNAME FROM employee_masterlist WHERE EMPLOYID = $dm_name")->fetch_array()[0]; ?>
                            <div class="col-5">
                                <label class="control-label text-info">Acknowledge by :</label>
                                <input readonly type="text" class="form-control" id="dh_name" value="<?php echo isset($mngr)  ? $mngr : '' ?>">
                                <i class="text-info" style="display:block; text-align: center;">Approver 2</i>
                            </div>
                            <div class="col-4">
                                <label class="control-label text-info">Date:</label>
                                <input readonly type="text" class="form-control rounded-0" class="form-control form-control-sm rounded-0" value="<?php echo isset($dh_da_sign_date)  ? date('m/d/Y h:i a', strtotime($dh_da_sign_date)) : '' ?>" required>
                            </div>
                        <?php } else { ?>
                            <div class="col-5">
                                <label class="control-label  text-info">For Acknowledgement : </label>
                                <input readonly required type="text" class="form-control  rounded-0" class="form-control  rounded-0" placeholder="Department manager" value="">
                                <i class="text-info" style="display:block; text-align: center;">Approver 2</i>
                            </div>
                            <div class="col-4">
                                <label class="control-label  text-info">Date </label>
                                <input readonly required type="date" class="form-control  rounded-0" name="dh_sign_date" class="form-control  rounded-0" value="">

                            </div>
                        <?php } ?>
                    </div>

                </div>
                <div class=" py-1 text-center">
                    <?php if ($is_operator > 0) { ?>
                        <button class="btn btn-flat btn-sn btn-success" type="button" id="print"><i class="fa fa-print"></i> Print DA</button>
                    <?php } ?>

                    <a class="btn btn-flat btn-dark" href="<?php echo base_url . '/admin?page=incidentreport/manageIRDA' ?>">Back</a>

                </div>
            </div>
            <div class="mt-4 p-3 border rounded bg-light text-secondary small">
                <p class="fst-italic mb-2">
                    This acknowledgment is system-generated and does not require a physical signature.
                </p>
                <div class="ms-3">
                    <strong class="text-dark">Telford SVC. PHILS. INC</strong><br>
                    Telford Bldg., Linares St. Gateway Business Park, Brgy. Javalera, General Trias City, Cavite, Philippines 4107<br>
                    <span class="text-muted">Tel. No: 046-433-0536 / Fax No: 046-433-0529</span>
                </div>
            </div>
        </form>
    </div>
</div>


<script>
    $(document).ready(function() {
        $('.did').hide();

        $('#offense_no').change(function() {
            console.log($('#offense_no').val());
            if ($('#offense_no').val() == 3 || $('#offense_no').val() == 4) {
                $('#suspension').attr('required', true)
                $('#suspension').removeAttr('readonly')
            } else {
                $('#suspension').attr('readonly', true)
                $('#suspension').removeAttr('required')
            }
        });

        $('#print').click(function() {
            $('.dont_').hide();
            $('.did').show();
            var head = $('head').clone();
            var rep = $('.printable').clone();
            var ns = $('noscript').clone().html();
            start_loader()
            rep.find('.content').after('<div class="page-break"></div>');

            rep.prepend(ns)
            rep.prepend(head)
            rep.find('#print_header').show()
            var nw = window.document.open('', '_blank', 'width=900,height=600')
            nw.document.write(rep.html())
            nw.document.close()
            setTimeout(function() {
                nw.print()
                setTimeout(function() {
                    $('.dont_').show();
                    $('.did').hide();
                    nw.close()
                    end_loader()
                }, 200)
            }, 300)
        })
    });

    $('.remove-option').click(function() {
        $(this).closest('.item').remove()
    })
    // Add Option button click event
    $('#add_option').click(function() {

        // Clone the template option and convert it into a jQuery object
        var item = $($('#option-clone').html()).clone();

        // Append the modified item to the option list
        $('#option-list').append(item);

        // Attach event handlers to the cloned item

        item.find('.remove-option').click(function() {
            $(this).closest('.item').remove();

        });
    });
    var messageType = 1;

    // $(window).on("beforeunload", function(event) {
    //     // Show a warning message
    //     if (messageType == 1) {
    //         return "Are you sure you want to leave? Your changes may not be saved.";
    //     }

    // });

    $('#ir-form').submit(function(e) {
        e.preventDefault();
        messageType = 2;
        var _this = $(this)
        $('.err-msg').remove();
        var el = $('<div>')
        el.addClass("alert err-msg")
        el.hide()
        start_loader();
        $.ajax({
            url: _base_url_ + "classes/Master.php?f=save_ir_request",
            data: new FormData($(this)[0]),
            cache: false,
            contentType: false,
            processData: false,
            method: 'POST',
            type: 'POST',
            dataType: 'json',
            error: err => {
                console.error(err)
                el.addClass('alert-danger').text("An error occured");
                _this.prepend(el)
                el.show('.modal')
                end_loader();
            },
            success: function(resp) {
                if (typeof resp == 'object' && resp.status == 'success') {
                    location.reload();
                    // location.replace(_base_url_ + 'admin/?page=pcn_form/')
                } else if (resp.status == 'failed' && !!resp.msg) {
                    el.addClass('alert-danger').text(resp.msg);
                    _this.prepend(el)
                    el.show('.modal')
                } else {
                    el.text("An error occured");
                    console.error(resp)
                }
                $("html, body").scrollTop(0);
                end_loader()

            }
        })
    })
    $(document).ready(function() {
        $('.ack_data').click(function() {
            _conf("Are you sure to acknowledge this disciplinary action?", "ack_data", [$(this).attr('data-id'), $(this).attr('data-sign'), $(this).attr('data-emp'), $(this).attr('data-mngr')])
        })
        $('.table td,.table th').addClass('py-1 px-2 align-middle')
        $('.table').dataTable();
    })

    function ack_data($id, $sign, $emp_no, $mngr) {
        start_loader();
        $.ajax({
            url: _base_url_ + "classes/IR_DA_Master.php?f=ack_data",
            method: "POST",
            data: {
                id: $id,
                sign: $sign,
                emp_no: $emp_no,
                mngr: $mngr
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
    // document.getElementById("incidentreport/createNewIRDA").addEventListener("keydown", function(event) {
    //     // Check if the Enter key is pressed (key code 13)
    //     if (event.key === "Enter") {
    //         // Prevent the default form submission behavior
    //         event.preventDefault();
    //     }
    // });
</script>