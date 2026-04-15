<?php
$EMPLOYID = $_settings->userdata('EMPLOYID');

// Employees
$employees = [];
$sql = "SELECT * FROM `employee_masterlist` WHERE EMPLOYID != 0 AND (APPROVER1 = {$EMPLOYID} OR APPROVER2 = {$EMPLOYID} OR APPROVER3 = {$EMPLOYID}) AND ACCSTATUS = 1";
$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $employees[$row['EMPLOYID']] = $row['EMPLOYID'] . ' - ' . $row['EMPNAME'];
    }
}

// Status options based on your logic
$statusOptions = [
    'pending' => 'Pending',
    'letter_explanation' => 'Letter of explanation',
    'for_assessment' => 'For assessment',
    'for_approval_department' => 'For approval department',
    'for_validation' => 'For Validation',
    'served' => 'Served',
    'invalid_dispositions' => 'Invalid Dispositions',
    'for_da' => 'For DA',
    'for_hr_manager' => 'For HR Manager',
    'for_supervisor' => 'For Supervisor',
    'for_department_manager' => 'For Department manager',
    'for_acknowledgement' => 'For Acknowledgement',
    'acknowledged' => 'Acknowledged',
    'cancelled' => 'Cancelled',
    'inactive' => 'Inactive',
    'disapproved' => 'Disapproved'
];
?>
<div class="card card-outline card-primary">
    <div class="card-header p-0 pt-1">
        <ul class="nav nav-tabs" id="custom-tabs-one-tab" role="tablist">
            <li class="pt-2 px-3">
                <h3 class="card-title">List of Incident Reports</h3>
            </li>
            <li class="nav-item">
                <a class="nav-link active" id="custom-tabs-one-active-tab" data-toggle="pill"
                    href="#custom-tabs-one-active" role="tab" aria-controls="custom-tabs-one-active"
                    aria-selected="true">Active</a>
            </li>
            <li class="nav-item ml-auto">
                <a href="<?php echo base_url ?>admin/incidentReport/issuedIRDA/staffIssuedIR.php"
                    class="btn btn-flat btn-primary">
                    <span class="fas fa-download"></span> Export
                </a>
            </li>
        </ul>
    </div>

    <div class="card-body">
        <div class="tab-content" id="custom-tabs-one-tabContent">
            <div class="tab-pane fade show active" id="custom-tabs-one-active" role="tabpanel"
                aria-labelledby="custom-tabs-one-active-tab">
                <div class="container-fluid">

                    <!-- Enhanced search and filter controls -->
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <label for="status-filter">Status Filter:</label>
                            <select id="status-filter" class="form-control select2" style="width: 100%;">
                                <option value="">All Statuses</option>
                                <?php foreach ($statusOptions as $value => $label): ?>
                                    <option value="<?php echo $value; ?>"><?php echo $label; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label for="employee-filter">Employee Filter:</label>
                            <select id="employee-filter" class="form-control select2" style="width: 100%;">
                                <option value="">All Employees</option>
                                <?php foreach ($employees as $empId => $empName): ?>
                                    <option value="<?php echo $empId; ?>"><?php echo htmlspecialchars($empName); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="date-from">Date From:</label>
                            <input type="date" id="date-from" class="form-control">
                        </div>
                        <div class="col-md-3">
                            <label for="date-to">Date To:</label>
                            <input type="date" id="date-to" class="form-control">
                        </div>
                    </div>

                    <div class="row mb-3">

                        <div class="col-md-9 d-flex align-items-end">
                            <button type="button" id="clear-filters" class="btn btn-outline-secondary mr-2">
                                <i class="fas fa-times"></i> Clear Filters
                            </button>
                            <button type="button" id="refresh-table" class="btn btn-outline-primary">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>

                    <table id="incident-reports-table" class="table table-bordered table-striped" style="width:100%">
                        <thead>
                            <tr class="bg-gradient-primary text-center">
                                <th>#</th>
                                <th>IR Date</th>
                                <th>IR No</th>
                                <th>Issued to</th>
                                <th>Supervisor</th>
                                <th>PL</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Remarks</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Data will be loaded via AJAX -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function() {

        // Initialize DataTable with server-side processing
        const table = $('#incident-reports-table').DataTable({
            processing: true,
            serverSide: true,
            ajax: {
                url: _base_url_ + "admin/incidentReport/issuedIRDA/issue_irda.php",
                type: 'POST',
                data: function(d) {
                    // Add custom filters to the request
                    d.status_filter = $('#status-filter').val();
                    d.department_filter = $('#department-filter').val();
                    d.employee_filter = $('#employee-filter').val();
                    d.date_from = $('#date-from').val();
                    d.date_to = $('#date-to').val();
                },
                error: function(xhr, error, thrown) {
                    console.error('DataTable AJAX error:', error, thrown);
                    alert('Error loading data. Please refresh the page and try again.');
                }
            },
            columns: [{
                    data: 0,
                    orderable: false,
                    searchable: false,
                    width: '5%'
                }, // Row number
                {
                    data: 1,
                    width: '10%'
                }, // IR Date
                {
                    data: 2,
                    width: '10%'
                }, // IR No
                {
                    data: 3,
                    width: '15%'
                }, // Issued to
                {
                    data: 4,
                    width: '12%'
                }, // Supervisor
                {
                    data: 5,
                    width: '8%'
                }, // PL
                {
                    data: 6,
                    width: '10%'
                }, // Department
                {
                    data: 7,
                    orderable: false,
                    width: '15%'
                }, // Status
                {
                    data: 8,
                    orderable: false,
                    searchable: false,
                    width: '15%'
                }, // Remarks
                {
                    data: 9,
                    orderable: false,
                    searchable: false,
                    width: '10%'
                } // Action
            ],
            order: [
                [1, 'desc']
            ], // Order by IR Date descending by default
            pageLength: 25,
            lengthMenu: [
                [10, 25, 50, 100, -1],
                [10, 25, 50, 100, "All"]
            ],
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                '<"row"<"col-sm-12"tr>>' +
                '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            language: {
                processing: '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div> Loading...',
                emptyTable: 'No incident reports found',
                info: 'Showing _START_ to _END_ of _TOTAL_ incident reports',
                infoEmpty: 'Showing 0 to 0 of 0 incident reports',
                infoFiltered: '(filtered from _MAX_ total incident reports)',
                lengthMenu: 'Show _MENU_ incident reports per page',
                search: 'Search incident reports:',
                zeroRecords: 'No matching incident reports found'
            },
            responsive: true,
            scrollX: true,
            stateSave: true, // Save table state (pagination, search, etc.)
            stateDuration: 60 * 60 * 24, // Save state for 24 hours
            drawCallback: function(settings) {
                // Re-initialize any tooltips or other UI elements after table redraw
                $('[data-toggle="tooltip"]').tooltip();
            }
        });

        // Custom filter event handlers
        $('#status-filter, #department-filter, #employee-filter, #date-from, #date-to').on('change', function() {
            table.ajax.reload();
        });

        // Refresh button
        $('#refresh-table').on('click', function() {
            table.ajax.reload(null, false); // false = keep current page
        });

        // Clear filters button
        $('#clear-filters').on('click', function() {
            // Clear Select2 selections
            $('#status-filter, #department-filter, #employee-filter').val(null).trigger('change');
            $('#date-from, #date-to').val('');
            table.ajax.reload();
        });

        // Handle action button clicks (delegation for dynamically loaded content)
        $('#incident-reports-table').on('click', '.delete_data', function() {
            const id = $(this).attr('data-id');
            if (confirm('Are you sure to cancel this incident report?')) {
                deleteIncidentReport(id);
            }
        });

        $('#incident-reports-table').on('click', '.issue_da', function() {
            const id = $(this).attr('data-id');
            // Use your existing modal function
            uni_modal("Are you sure to issue disciplinary action on this incident report?",
                "incidentreport/createNewIRDA/new_da.php?id=" + id, 'mid-large');
        });

        // Export functionality
        $('#export-btn').on('click', function() {
            uni_modal("", "incidentreport/createNewIRDA/export_data.php", 'mid-large');
        });
    });

    function deleteIncidentReport(id) {
        $.ajax({
            url: _base_url_ + "classes/Master.php?f=ir_cancel",
            method: "POST",
            data: {
                id: id
            },
            dataType: "json",
            beforeSend: function() {
                // Show loading indicator
                $('.btn').prop('disabled', true);
            },
            success: function(resp) {
                if (typeof resp == 'object' && resp.status == 'success') {
                    // Reload the table instead of the entire page
                    $('#incident-reports-table').DataTable().ajax.reload();
                    alert_toast("Incident report cancelled successfully.", 'success');
                } else {
                    alert_toast("An error occurred.", 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Delete error:', error);
                alert_toast("An error occurred.", 'error');
            },
            complete: function() {
                $('.btn').prop('disabled', false);
            }
        });
    }

    // Performance monitoring (optional)
    $(document).ajaxStart(function() {
        console.time('AJAX Request');
    }).ajaxStop(function() {
        console.timeEnd('AJAX Request');
    });
</script>