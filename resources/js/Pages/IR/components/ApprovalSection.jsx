import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Card, CardContent } from "@/Components/ui/card";
import { ClipboardCheck, CheckCircle2, Clock3, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SectionCard } from "./IrShared";

const APPROVAL_META = [
    { label: "Reported by", sublabel: "Name", step: 1 },
    { label: "For Validation", sublabel: "HR Personnel", step: 2 },
    { label: "For Approval", sublabel: "Approver 1 (Supervisor)", step: 3 },
    { label: "For Approval", sublabel: "Approver 2 (Dept Head)", step: 4 },
];

export function ApprovalSection({ approvals, updateApproval }) {
    return (
        <SectionCard icon={ClipboardCheck} title="Approval & Validation">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {APPROVAL_META.map(({ label, sublabel, step }, idx) => {
                    const approval = approvals[idx];
                    const hasEmpNo = !!approval?.approver_emp_no;
                    const hasName  = !!approval?.approver_name;
                    const hasDate  = !!approval?.sign_date;
                    const assigned = hasName;

                    return (
                        <Card
                            key={idx}
                            className={cn(
                                "border transition-colors shadow-sm",
                                assigned
                                    ? "bg-green-50/40 border-green-200/70 dark:bg-green-900/10 dark:border-green-800/40"
                                    : "bg-muted/10 border-border/60",
                            )}
                        >
                            <CardContent className="p-4 space-y-3">
                                {/* Header: step label + status badge */}
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Step {step} — {label}
                                        </p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            {sublabel}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                                            assigned
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {assigned ? (
                                            <>
                                                <CheckCircle2 className="w-3 h-3" />
                                                Assigned
                                            </>
                                        ) : (
                                            <>
                                                <Clock3 className="w-3 h-3" />
                                                Pending
                                            </>
                                        )}
                                    </span>
                                </div>

                                {/* Name field */}
                                <div className="flex items-center gap-2">
                                    {hasEmpNo && (
                                        <span className="shrink-0 font-mono text-xs text-muted-foreground bg-muted/70 border rounded px-1.5 py-1">
                                            #{approval.approver_emp_no}
                                        </span>
                                    )}
                                    {hasName ? (
                                        <Input
                                            value={approval.approver_name}
                                            readOnly
                                            disabled
                                            className={cn(
                                                "text-sm flex-1 h-8",
                                                assigned
                                                    ? "bg-green-50/60 border-green-200/60"
                                                    : "bg-muted/40",
                                            )}
                                        />
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic">
                                            Not yet assigned
                                        </span>
                                    )}
                                </div>

                                {/* Date — only shown when signed */}
                                {hasDate && (
                                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/40 text-xs text-muted-foreground">
                                        <CalendarDays className="w-3 h-3 shrink-0" />
                                        {format(new Date(approval.sign_date), "MMM d, yyyy")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </SectionCard>
    );
}
