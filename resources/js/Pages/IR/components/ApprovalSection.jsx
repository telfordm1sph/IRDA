import { Input } from "@/Components/ui/input";
import { DatePicker } from "@/Components/ui/date-picker";
import { ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SectionCard } from "./IrShared";

const APPROVAL_META = [
    { label: "Reported by",    sublabel: "Name",         readOnly: true  },
    { label: "For Validation", sublabel: "HR Personnel", readOnly: false },
    { label: "For Approval",   sublabel: "Approver 1",   readOnly: false },
    { label: "For Approval",   sublabel: "Approver 2",   readOnly: false },
];

export function ApprovalSection({ approvals, updateApproval }) {
    return (
        <SectionCard icon={ClipboardCheck} title="Approval & Validation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {APPROVAL_META.map(({ label, sublabel, readOnly }, idx) => {
                    const approval = approvals[idx];
                    const hasName  = !!approval?.approver_name;

                    return (
                        <div
                            key={idx}
                            className="grid grid-cols-[minmax(0,1fr)_14rem] gap-3 items-start"
                        >
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    {label}
                                </p>
                                <Input
                                    value={approval?.approver_name ?? ""}
                                    onChange={(e) =>
                                        !readOnly && updateApproval(idx, "approver_name", e.target.value)
                                    }
                                    readOnly={readOnly || !hasName}
                                    disabled={readOnly || !hasName}
                                    placeholder={readOnly ? "" : `Enter ${sublabel} name…`}
                                    className={cn(
                                        "text-sm",
                                        (readOnly || !hasName) && "bg-muted/40",
                                    )}
                                />
                                <p className="text-[11px] text-left text-muted-foreground mt-1.5">
                                    {sublabel}
                                </p>
                            </div>

                            <div className="w-full min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                    Date
                                </p>
                                {readOnly ? (
                                    <Input
                                        readOnly
                                        value={format(new Date(), "MMM d, yyyy")}
                                        className="h-9 w-full text-sm bg-muted/40"
                                    />
                                ) : (
                                    <DatePicker
                                        value={approval?.sign_date ?? ""}
                                        onChange={(v) => updateApproval(idx, "sign_date", v ?? "")}
                                        placeholder="Pick date…"
                                        className="h-9 w-full"
                                        disabled={!hasName}
                                        clearable={false}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </SectionCard>
    );
}
