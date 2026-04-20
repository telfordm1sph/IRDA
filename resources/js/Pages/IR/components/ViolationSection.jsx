import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Separator } from "@/Components/ui/separator";
import { Combobox } from "@/Components/ui/combobox";
import { DatePicker } from "@/Components/ui/date-picker";
import { AlertCircle, BookOpen, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard, FieldError } from "./IrShared";
import { DA_TYPES } from "./IrConstants";

export function ViolationSection({ data, setData, errors, updateItem, addItem, removeItem, addDate, removeDate, updateDate, loadCodeOptions, openModal }) {
    return (
        <SectionCard icon={AlertCircle} title="Violation Details">
            <div className="space-y-5">
                {/* Admin / Quality radio */}
                <div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                        Please check the appropriate box and indicate the reference no. for quality violation:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { value: false, label: "Administrative" },
                            { value: true,  label: "Quality" },
                        ].map(({ value, label }) => {
                            const active = data.quality_violation === value;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setData("quality_violation", value)}
                                    className={cn(
                                        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left",
                                        active
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-input bg-background text-foreground hover:border-muted-foreground",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                                            active ? "border-primary bg-primary/10" : "border-input",
                                        )}
                                    >
                                        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                                    </span>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Reference (Quality only) */}
                {data.quality_violation && (
                    <div className="max-w-md animate-in fade-in slide-in-from-top-1 duration-150">
                        <Label htmlFor="reference" className="mb-1.5 block">
                            Reference Document (IPN / QDN / SQS){" "}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="reference"
                            placeholder="Enter reference document number…"
                            value={data.reference}
                            onChange={(e) => setData("reference", e.target.value)}
                            className={cn("text-sm", errors.reference && "border-destructive")}
                        />
                        <FieldError message={errors.reference} />
                    </div>
                )}

                <Separator />

                {/* Violations table */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Label>
                            Violations <span className="text-destructive">*</span>
                        </Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addItem}
                            className="h-7 text-xs gap-1.5 border-dashed"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Row
                        </Button>
                    </div>

                    <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[700px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        {[
                                            ["Code No.", "w-36"],
                                            ["Violation / Nature of Offense", ""],
                                            ["D.A.", "w-44"],
                                            ["Date(s) Committed", "w-48"],
                                            ["No. of Offense", "w-28"],
                                            ["", "w-10"],
                                        ].map(([h, w], i) => (
                                            <th
                                                key={i}
                                                className={cn(
                                                    "text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                                                    w,
                                                )}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((item, idx) => (
                                        <tr
                                            key={idx}
                                            className={cn(
                                                "border-b last:border-0",
                                                idx % 2 !== 0 && "bg-muted/20",
                                            )}
                                        >
                                            <td className="px-2 py-2">
                                                <div className="flex gap-1">
                                                    <Combobox
                                                        loadOptions={loadCodeOptions}
                                                        value={item.code_no}
                                                        onChange={(v) => updateItem(idx, "code_no", v ?? "")}
                                                        placeholder="---"
                                                        clearable={false}
                                                        allowCustomValue={false}
                                                        className="h-8 text-xs flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openModal(idx)}
                                                        className="h-8 px-2 text-xs"
                                                    >
                                                        <BookOpen className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <Input
                                                    readOnly
                                                    value={item.violation}
                                                    placeholder="Auto-filled on code selection"
                                                    className="h-8 text-xs bg-muted/40"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <Combobox
                                                    options={DA_TYPES}
                                                    value={item.da_type}
                                                    onChange={(v) => updateItem(idx, "da_type", v ?? "")}
                                                    placeholder="— Select DA —"
                                                    clearable={false}
                                                    allowCustomValue={false}
                                                    className="h-8 text-xs"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="space-y-1">
                                                    {(item.date_committed?.length ? item.date_committed : [""]).map((d, di) => (
                                                        <div key={di} className="flex gap-1 items-center">
                                                            <DatePicker
                                                                value={d}
                                                                onChange={(v) => updateDate(idx, di, v ?? "")}
                                                                placeholder="Pick date…"
                                                                clearable={false}
                                                                className="h-7 flex-1 text-xs"
                                                            />
                                                            {item.date_committed.length > 1 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => removeDate(idx, di)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs gap-1 px-1 text-muted-foreground hover:text-foreground"
                                                        onClick={() => addDate(idx)}
                                                    >
                                                        <Plus className="w-3 h-3" /> Add date
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <Input
                                                    placeholder="e.g. 1st"
                                                    value={item.offense_no}
                                                    onChange={(e) => updateItem(idx, "offense_no", e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeItem(idx)}
                                                    disabled={data.items.length === 1}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <FieldError message={errors.items} />
                </div>
            </div>
        </SectionCard>
    );
}
