"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.ComponentProps<"div"> {
    date: DateRange | undefined;
    onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangePicker({
  className,
  date: parentDate,
  onDateChange
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<DateRange | undefined>(parentDate);

  React.useEffect(() => {
    setDate(parentDate);
  }, [parentDate]);

  const handleApply = () => {
    onDateChange(date);
    setOpen(false);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !parentDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {parentDate?.from ? (
              parentDate.to ? (
                <>
                  {format(parentDate.from, "LLL dd, y")} -{" "}
                  {format(parentDate.to, "LLL dd, y")}
                </>
              ) : (
                format(parentDate.from, "LLL dd, y")
              )
            ) : (
              <span>Escolha uma data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
           <div className="p-4 border-t flex justify-end">
              <Button onClick={handleApply}>Aplicar</Button>
           </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
