import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { DatePicker } from "@/Components/ui/date-picker";
import { ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SectionCard } from "./IrShared";

const APPROVAL_META = [
    { label: "Reported by", sublabel: "Name", readOnly: true },
    { label: "For Validation", sublabel: "HR Personnel", readOnly: true },
    { label: "For Approval", sublabel: "Approver 1", readOnly: true },
    { label: "For Approval", sublabel: "Approver 2", readOnly: true },
];

export function ApprovalSection({ approvals, updateApproval }) {
    return (
        <SectionCard icon={ClipboardCheck} title="Approval & Validation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {APPROVAL_META.map(({ label, sublabel, readOnly }, idx) => {
                    const approval = approvals[idx];
                    const hasEmpNo = !!approval?.approver_emp_no;
                    const hasName = !!approval?.approver_name;
                    const hasDate = !!approval?.sign_date;

                    return (
                        <div
                            key={idx}
                            className="grid grid-cols-[minmax(0,1fr)_14rem] gap-3 items-start"
                        >
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    {label}
                                </p>
                                <div className="flex items-center gap-2 h-9">
                                    {hasEmpNo && (
                                        <span className="shrink-0 font-mono text-xs text-muted-foreground bg-muted/60 border rounded px-1.5 py-1">
                                            #{approval.approver_emp_no}
                                        </span>
                                    )}
                                    {hasName ? (
                                        <Input
                                            value={approval.approver_name}
                                            readOnly
                                            disabled
                                            className="text-sm flex-1 bg-muted/40"
                                        />
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            Pending
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[11px] text-left text-muted-foreground mt-1.5">
                                    {sublabel}
                                </p>
                            </div>

                            <div className="w-full min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    Date
                                </p>
                                {hasDate ? (
                                    <Input
                                        readOnly
                                        value={format(new Date(approval.sign_date), "MMM d, yyyy")}
                                        className="h-9 w-full text-sm bg-muted/40"
                                    />
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground">
                                        Pending
                                    </Badge>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </SectionCard>
    );
}
