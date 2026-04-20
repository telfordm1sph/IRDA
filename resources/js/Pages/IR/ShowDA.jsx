import { useRef, useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    FileWarning,
    ArrowLeft,
    User,
    ShieldCheck,
    ClipboardList,
    FileCheck,
    CheckCircle,
    CheckCircle2,
    Printer,
    AlertCircle,
    Clock3,
    CalendarDays,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { SectionCard, OffenseBadge } from "./components/IrShared";
import { IrStatusBadge } from "./components/IrStatusBadge";
import { PrintableDA } from "./components/PrintableDA";
import {
    safeFormat,
    safeFormatDT,
    formatMultiDates,
    firstDate,
} from "@/utils/dateFormat";
import { cn } from "@/lib/utils";

// ── Lazy section ──────────────────────────────────────────────────────────────
function LazySection({ children }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { rootMargin: "300px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={ref}>
            {visible ? (
                children
            ) : (
                <div className="h-28 rounded-xl border bg-muted/20 animate-pulse" />
            )}
        </div>
    );
}

// ── Read-only field ───────────────────────────────────────────────────────────
function ReadField({ label, value, mono = false }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {label}
            </p>
            <p
                className={`text-sm font-medium ${mono ? "font-mono" : ""} ${!value ? "text-muted-foreground" : ""}`}
            >
                {value || "—"}
            </p>
        </div>
    );
}

// ── Modern DA signature block ─────────────────────────────────────────────────
function DaSignatureBlock({
    label,
    name,
    date,
    pending = false,
    actionLabel = "Signed",
}) {
    const signed = !!name && !!date;
    return (
        <div
            className={cn(
                "rounded-xl border overflow-hidden flex flex-col transition-colors",
                signed
                    ? "bg-green-50/50 border-green-200/70 dark:bg-green-900/10 dark:border-green-800/40"
                    : "bg-muted/20 border-border/60",
            )}
        >
            {/* top accent bar */}
            <div
                className={cn(
                    "h-1 w-full shrink-0",
                    signed ? "bg-green-500" : "bg-border/60",
                )}
            />

            <div className="p-3 flex flex-col gap-2 flex-1">
                {/* label (2-line max) + status pill */}
                <div className="flex items-start justify-between gap-1 min-h-[2.5rem]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight line-clamp-2 flex-1">
                        {label}
                    </span>
                    <span
                        className={cn(
                            "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5",
                            signed
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-muted text-muted-foreground",
                        )}
                    >
                        {signed ? (
                            <>
                                <CheckCircle2 className="w-2.5 h-2.5" />{" "}
                                {actionLabel}
                            </>
                        ) : (
                            <>
                                <Clock3 className="w-2.5 h-2.5" />{" "}
                                {pending ? "Pending" : "—"}
                            </>
                        )}
                    </span>
                </div>

                {/* name — fixed height so date always aligns */}
                <div className="h-[2.75rem] flex items-start overflow-hidden">
                    {name ? (
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 w-full">
                            {name}
                        </p>
                    ) : (
                        <span className="text-sm text-muted-foreground italic">
                            {pending ? "Awaiting signature" : "—"}
                        </span>
                    )}
                </div>

                {/* date — mt-auto pins to bottom regardless of content above */}
                <div className="mt-auto flex items-center gap-1.5 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    <span className="leading-tight">{date || "—"}</span>
                </div>
            </div>
        </div>
    );
}

// ── Action panel wrapper ───────────────────────────────────────────────────────
function ActionPanel({ title, children }) {
    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base text-primary">
                        {title}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    );
}

// ── Cleansing date helpers ─────────────────────────────────────────────────────
const CLEANSING_MONTHS = { A: 6, B: 9, C: 12, D: 18 };

function cleansingDate(codeNo, dateCommitted) {
    const letter = codeNo?.match(/[a-zA-Z]/)?.[0]?.toUpperCase();
    const months = CLEANSING_MONTHS[letter];
    if (!months || !dateCommitted) return null;
    const d = new Date(dateCommitted);
    if (isNaN(d.getTime())) return null;
    d.setMonth(d.getMonth() + months);
    return safeFormat(d.toISOString(), "MM-dd-yyyy");
}

// ── Flash banner ──────────────────────────────────────────────────────────────
function FlashBanner() {
    const { flash } = usePage().props;
    if (!flash?.success && !flash?.error) return null;
    const isSuccess = !!flash.success;
    return (
        <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 mb-4 ${
                isSuccess
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-red-300 bg-red-50 text-red-800"
            }`}
        >
            {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">
                {flash.success ?? flash.error}
            </p>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShowDA({
    ir,
    hash,
    currentUserRole,
    currentEmpId,
    availableActions = {},
}) {
    const { hrMngrCanApproveDa, svCanAckDa, dhCanAckDa, empCanAckDa } =
        availableActions;

    const hasDaAction =
        hrMngrCanApproveDa || svCanAckDa || dhCanAckDa || empCanAckDa;

    const byRole = Object.fromEntries(
        (ir.approvals ?? []).map((a) => [a.role, a]),
    );
    const hrApproval = byRole["hr"];
    const svApproval = byRole["sv"];
    const dhApproval = byRole["dh"];
    const hrMngrApproval = byRole["hr_mngr"];
    const da = ir.da_request ?? {};

    const totalDays = (ir.violations ?? []).reduce(
        (sum, v) => sum + (Number(v.days_no) || 0),
        0,
    );
    const isAcknowledged = !!da.acknowledge_da;

    const [submitting, setSubmitting] = useState(false);

    function post(routeName, data) {
        setSubmitting(true);
        router.post(route(routeName, hash), data, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`DA — ${ir.ir_no}`} />

            <PrintableDA ir={ir} />

            <FlashBanner />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 print:hidden">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <FileCheck className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold tracking-tight">
                                Notice of Disciplinary Action
                            </h1>
                            <span className="font-mono text-muted-foreground text-sm">
                                {ir.ir_no}
                            </span>
                            <IrStatusBadge status={ir.display_status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Issued{" "}
                            {safeFormat(da.da_requested_date, "MMMM d, yyyy") ??
                                "—"}
                            {da.da_requestor_name &&
                                ` by ${da.da_requestor_name}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                    {isAcknowledged && currentUserRole === "hr" && (
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => window.print()}
                        >
                            <Printer className="w-3.5 h-3.5" /> Print DA
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.get(route("ir.show", hash))}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> View IR
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.get(route("ir.index"))}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                </div>
            </div>

            <div className="space-y-4 print:hidden">
                {/* I. Employee Details */}
                <SectionCard icon={User} title="I. Details of Person Involved">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                        <ReadField
                            label="Employee No."
                            value={ir.emp_no}
                            mono
                        />
                        <ReadField
                            label="Shift / Team"
                            value={
                                [ir.shift, ir.team]
                                    .filter(Boolean)
                                    .join(" / ") || null
                            }
                        />
                        <ReadField label="Employee Name" value={ir.emp_name} />
                        <ReadField label="Station" value={ir.station} />
                        <ReadField label="Position" value={ir.position} />
                        <ReadField label="Department" value={ir.department} />
                        <ReadField label="Product Line" value={ir.prodline} />
                    </div>
                </SectionCard>

                {/* II. Cleansing Period */}
                <SectionCard icon={ShieldCheck} title="II. Cleansing Period">
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            {
                                label: "Verbal Warning",
                                months: "6 Months",
                                border: "border-l-4 border-l-gray-400",
                            },
                            {
                                label: "Written Warning",
                                months: "9 Months",
                                border: "border-l-4 border-l-green-600",
                            },
                            {
                                label: "3 Days Suspension",
                                months: "12 Months",
                                border: "border-l-4 border-l-teal-600",
                            },
                            {
                                label: "7 Days Suspension",
                                months: "18 Months",
                                border: "border-l-4 border-l-yellow-500",
                            },
                            {
                                label: "Dismissal",
                                months: "--",
                                border: "border-l-4 border-l-red-600",
                            },
                        ].map(({ label, months, border }) => (
                            <div
                                key={label}
                                className={`rounded-md border bg-muted/30 px-3 py-3 text-center ${border}`}
                            >
                                <p className="text-xs font-semibold text-foreground">
                                    {label}
                                </p>
                                <p className="text-xs italic text-muted-foreground mt-1">
                                    {months}
                                </p>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* III. DA Violations Table */}
                <LazySection>
                    <SectionCard
                        icon={ClipboardList}
                        title="III. Disciplinary Action Details"
                    >
                        <div className="rounded-lg border overflow-x-auto">
                            <table className="w-full text-sm min-w-[700px]">
                                <thead>
                                    <tr className="bg-muted/40 border-b">
                                        {[
                                            "Code No.",
                                            "Violation / Nature of Offense",
                                            "D.A. Type",
                                            "Date Committed",
                                            "Offense No.",
                                            "Schedule of Suspension",
                                            "Cleansing Date",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(ir.violations ?? []).map((v, i) => (
                                        <tr
                                            key={i}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs font-semibold">
                                                {v.code_no}
                                            </td>
                                            <td className="px-4 py-3 text-sm max-w-[220px]">
                                                {v.violation}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <OffenseBadge
                                                    value={v.da_type}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {formatMultiDates(
                                                    v.date_committed,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {v.offense_no ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-xs"
                                                    >
                                                        {v.offense_no}
                                                    </Badge>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                {v.date_of_suspension ? (
                                                    safeFormat(
                                                        v.date_of_suspension,
                                                        "MM-dd-yyyy",
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                                {v.days_no ? (
                                                    <span className="ml-1 text-muted-foreground">
                                                        ({v.days_no}d)
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                {cleansingDate(
                                                    v.code_no,
                                                    firstDate(v.date_committed),
                                                ) ?? (
                                                    <span className="text-muted-foreground">
                                                        {Number(v.da_type) === 5
                                                            ? "Dismissal"
                                                            : "—"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!ir.violations?.length && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-sm text-muted-foreground"
                                            >
                                                No violations recorded.
                                            </td>
                                        </tr>
                                    )}
                                    {totalDays > 0 && (
                                        <tr className="bg-muted/20 font-medium">
                                            <td
                                                colSpan={5}
                                                className="px-4 py-2.5 text-right text-xs text-muted-foreground uppercase tracking-wide"
                                            >
                                                Total No. of Days:
                                            </td>
                                            <td className="px-4 py-2.5 text-xs font-semibold">
                                                {totalDays} day
                                                {totalDays !== 1 ? "s" : ""}
                                            </td>
                                            <td />
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </LazySection>

                {/* IV. Commitment Letter */}
                <LazySection>
                    <SectionCard
                        icon={FileWarning}
                        title="IV. Commitment Letter"
                    >
                        <div className="rounded-md border bg-muted/20 px-5 py-5 text-sm leading-relaxed space-y-3">
                            <p>
                                I,{" "}
                                <span className="font-semibold">
                                    {ir.emp_name || "___________________"}
                                </span>
                                ,understand the seriousness of my actions and
                                the potential consequences that may arise from
                                such violations. I want to assure you that I
                                take full responsibility for my behavior and am
                                committed to rectifying the situation. Moving
                                forward, I pledge to adhere to all rules,
                                policies, and guidelines set forth the company
                                (Telford Svc. Phils. Inc).
                            </p>
                        </div>
                    </SectionCard>
                </LazySection>

                {/* V. Employee Acknowledgement */}
                <LazySection>
                    <SectionCard
                        icon={isAcknowledged ? CheckCircle : FileCheck}
                        title="V. Employee Acknowledgement"
                    >
                        {isAcknowledged ? (
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-green-700">
                                        Acknowledged by {ir.emp_name}
                                    </p>
                                    {da.acknowledge_date && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {safeFormat(
                                                da.acknowledge_date,
                                                "MMMM d, yyyy",
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                Awaiting employee acknowledgement.
                            </p>
                        )}
                    </SectionCard>
                </LazySection>

                {/* VI. DA Approval Signatures — modern cards */}
                <LazySection>
                    <SectionCard
                        icon={ShieldCheck}
                        title="VI. Approval Signatures"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                            <DaSignatureBlock
                                label="Issued to (Employee)"
                                name={ir.emp_name}
                                date={safeFormat(da.acknowledge_date)}
                                pending={!da.acknowledge_da}
                                actionLabel="Acknowledged"
                            />
                            <DaSignatureBlock
                                label="Issued by (HR)"
                                name={
                                    hrApproval?.approver_name ??
                                    da.da_requestor_name
                                }
                                date={safeFormatDT(
                                    hrApproval?.sign_date ??
                                        da.da_requested_date,
                                )}
                                actionLabel="Issued"
                            />
                            <DaSignatureBlock
                                label="HR Manager"
                                name={hrMngrApproval?.approver_name ?? null}
                                date={safeFormatDT(hrMngrApproval?.sign_date)}
                                pending={!hrMngrApproval?.sign_date}
                                actionLabel="Approved"
                            />
                            <DaSignatureBlock
                                label="Supervisor"
                                name={
                                    svApproval?.da_sign_date
                                        ? svApproval?.approver_name
                                        : null
                                }
                                date={safeFormatDT(svApproval?.da_sign_date)}
                                pending={!svApproval?.da_sign_date}
                                actionLabel="Acknowledged"
                            />
                            <DaSignatureBlock
                                label="Dept Manager"
                                name={
                                    dhApproval?.da_sign_date
                                        ? dhApproval?.approver_name
                                        : null
                                }
                                date={safeFormatDT(dhApproval?.da_sign_date)}
                                pending={!dhApproval?.da_sign_date}
                                actionLabel="Acknowledged"
                            />
                        </div>
                    </SectionCard>
                </LazySection>

                {/* Company footer */}
                <div className="rounded-lg border bg-muted/10 px-5 py-4">
                    <p className="text-xs text-muted-foreground italic mb-2">
                        This acknowledgment is system-generated and does not require a physical signature.
                    </p>
                    <p className="text-sm font-bold">Telford SVC. PHILS. INC</p>
                    <p className="text-xs text-muted-foreground">
                        Telford Bldg., Linares St. Gateway Business Park, Brgy. Javalera, General Trias City, Cavite, Philippines 4107
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Tel No: 046-433-0536 / Fax No: 046-433-0529
                    </p>
                </div>

                {/* VII. Action Required — DA-phase actions ─────────────────────── */}
                {hasDaAction && (
                    <LazySection>
                        <SectionCard
                            icon={AlertCircle}
                            title="VII. Action Required"
                        >
                            {/* ── HR Manager: Approve DA ── */}
                            {hrMngrCanApproveDa && (
                                <ActionPanel title="HR Manager — Approve Disciplinary Action">
                                    <p className="text-sm text-muted-foreground">
                                        Review the Disciplinary Action details
                                        above and approve to forward to the
                                        supervisor for acknowledgement.
                                    </p>
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={submitting}
                                            onClick={() =>
                                                post("ir.da.hrApprove", {})
                                            }
                                        >
                                            Approve DA
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── Supervisor: Acknowledge DA ── */}
                            {svCanAckDa && (
                                <ActionPanel title="Supervisor — Acknowledge Disciplinary Action">
                                    <p className="text-sm text-muted-foreground">
                                        Review the Disciplinary Action issued to
                                        your direct report. By acknowledging,
                                        you confirm you have reviewed and are
                                        aware of this DA.
                                    </p>
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={submitting}
                                            onClick={() =>
                                                post("ir.da.svAck", {})
                                            }
                                        >
                                            Acknowledge DA
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── Dept Head / Manager: Acknowledge DA ── */}
                            {dhCanAckDa && (
                                <ActionPanel title="Department Manager — Acknowledge Disciplinary Action">
                                    <p className="text-sm text-muted-foreground">
                                        Review the Disciplinary Action as the
                                        department manager/head. By
                                        acknowledging, you confirm you have
                                        reviewed and are aware of this DA.
                                    </p>
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={submitting}
                                            onClick={() =>
                                                post("ir.da.dmAck", {})
                                            }
                                        >
                                            Acknowledge DA
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}

                            {/* ── Employee: Acknowledge DA ── */}
                            {empCanAckDa && (
                                <ActionPanel title="Acknowledge Your Disciplinary Action">
                                    <p className="text-sm text-muted-foreground">
                                        Please review all the DA details above
                                        carefully. By clicking acknowledge, you
                                        confirm that you have received and
                                        understood the Disciplinary Action
                                        imposed upon you.
                                    </p>
                                    <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground italic">
                                        I fully understand the disciplinary
                                        action imposed upon me and commit to
                                        strictly adhere to company rules and
                                        policies.
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={submitting}
                                            onClick={() =>
                                                post("ir.da.acknowledge", {})
                                            }
                                        >
                                            I Acknowledge this DA
                                        </Button>
                                    </div>
                                </ActionPanel>
                            )}
                        </SectionCard>
                    </LazySection>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
