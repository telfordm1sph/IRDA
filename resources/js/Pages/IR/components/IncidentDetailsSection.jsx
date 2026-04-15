import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { DatePicker } from "@/Components/ui/date-picker";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard, FieldError } from "./IrShared";

export function IncidentDetailsSection({ data, setData, errors }) {
    return (
        <SectionCard icon={MapPin} title="Statement of Facts / Incident Details">
            <div className="space-y-4">
                {/* What */}
                <div>
                    <Label htmlFor="what" className="mb-1.5 block">
                        What <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="what"
                        placeholder="Describe what happened…"
                        value={data.what}
                        onChange={(e) => setData("what", e.target.value)}
                        className={cn(
                            "min-h-[96px] resize-none text-sm",
                            errors.what && "border-destructive",
                        )}
                    />
                    <FieldError message={errors.what} />
                </div>

                {/* When / Where */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-1.5 block">
                            When <span className="text-destructive">*</span>
                        </Label>
                        <DatePicker
                            value={data.when_date}
                            onChange={(v) => setData("when_date", v ?? "")}
                            placeholder="Select date…"
                            clearable={false}
                            className="h-9 w-full"
                        />
                        <FieldError message={errors.when_date} />
                    </div>
                    <div>
                        <Label htmlFor="where_loc" className="mb-1.5 block">
                            Where <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="where_loc"
                            placeholder="Location of the incident…"
                            value={data.where_loc}
                            onChange={(e) => setData("where_loc", e.target.value)}
                            className={cn("text-sm", errors.where_loc && "border-destructive")}
                        />
                        <FieldError message={errors.where_loc} />
                    </div>
                </div>

                {/* How */}
                <div>
                    <Label htmlFor="how" className="mb-1.5 block">
                        How / Other Information <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="how"
                        placeholder="Describe how it happened and other relevant information…"
                        value={data.how}
                        onChange={(e) => setData("how", e.target.value)}
                        className={cn(
                            "min-h-[96px] resize-none text-sm",
                            errors.how && "border-destructive",
                        )}
                    />
                    <FieldError message={errors.how} />
                </div>
            </div>
        </SectionCard>
    );
}
