import { Label } from "@/Components/ui/label";
import { Combobox } from "@/Components/ui/combobox";
import { cn } from "@/lib/utils";
import { SectionCard, ReadOnlyField, FieldError } from "./IrShared";
import { User } from "lucide-react";

export function EmployeeSection({ empNo, setEmpNo, errors, loadEmployees, selectedEmp, selectedWorkDetails }) {
    const shiftTeam = selectedWorkDetails
        ? [selectedWorkDetails.shift_type, selectedWorkDetails.team].filter(Boolean).join(" / ")
        : "";

    return (
        <SectionCard icon={User} title="Details of Person Involved">
            <div className="space-y-4">
                {/* Row 1 — Employee No. */}
                <div>
                    <Label className="mb-1.5 block">
                        Employee No. <span className="text-destructive">*</span>
                    </Label>
                    <div
                        className={cn(
                            errors.emp_no &&
                                "[&_button]:border-destructive [&_button]:ring-1 [&_button]:ring-destructive",
                        )}
                    >
                        <Combobox
                            value={empNo}
                            onChange={(val) => setEmpNo(val ?? "")}
                            loadOptions={loadEmployees}
                            placeholder="Search by employee no. or name…"
                            className="h-9"
                        />
                    </div>
                    <FieldError message={errors.emp_no} />
                </div>

                {/* Row 2 — Name, Shift/Team, Department */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ReadOnlyField
                        label="Employee Name"
                        value={selectedEmp?.emp_name}
                    />
                    <ReadOnlyField
                        label="Shift / Team"
                        value={shiftTeam}
                    />
                    <ReadOnlyField
                        label="Department"
                        value={
                            selectedWorkDetails?.emp_dept ??
                            selectedWorkDetails?.emp_dept_id ??
                            ""
                        }
                    />
                </div>

                {/* Row 3 — Station, Prod Line, Position */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ReadOnlyField
                        label="Station"
                        value={
                            selectedWorkDetails?.emp_station ??
                            selectedWorkDetails?.emp_station_id ??
                            ""
                        }
                    />
                    <ReadOnlyField
                        label="Product Line"
                        value={
                            selectedWorkDetails?.emp_prodline ??
                            selectedWorkDetails?.emp_prodline_id ??
                            ""
                        }
                    />
                    <ReadOnlyField
                        label="Position"
                        value={
                            selectedWorkDetails?.emp_position ??
                            selectedWorkDetails?.emp_position_id ??
                            ""
                        }
                    />
                </div>
            </div>
        </SectionCard>
    );
}
