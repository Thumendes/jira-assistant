"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DateTimePickerProps = {
  idPrefix?: string;
  value?: string;
  onChange?: (value?: string) => void;
  labelDate?: string;
  labelTime?: string;
};

function formatDisplayDate(date?: Date) {
  if (!date) return "Select date";
  try {
    return date.toLocaleDateString();
  } catch {
    return "Select date";
  }
}

function pad(number: number) {
  return number.toString().padStart(2, "0");
}

function toTimeString(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseTimeString(value?: string) {
  if (!value) return { h: 0, m: 0, s: 0 };
  const parts = value.split(":").map((p) => parseInt(p || "0", 10));
  const [h, m, s] = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  return { h, m, s };
}

export function DateTimePicker({
  idPrefix = "dtp",
  value,
  onChange,
  labelDate = "Date",
  labelTime = "Time",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [time, setTime] = React.useState<string>("00:00:00");

  // Sync from external value
  React.useEffect(() => {
    if (!value) {
      const now = new Date();
      setDate(now);
      setTime(toTimeString(now));
      return;
    }

    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      setDate(d);
      setTime(toTimeString(d));
    }
  }, [value]);

  // Push combined ISO to parent
  const emitChange = React.useCallback(
    (nextDate?: Date, nextTime?: string) => {
      if (!onChange) return;
      if (!nextDate) {
        onChange(undefined);
        return;
      }
      const { h, m, s } = parseTimeString(nextTime ?? time);
      const d = new Date(nextDate);
      d.setHours(h, m, s, 0);
      onChange(d.toISOString());
    },
    [onChange, time]
  );

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor={`${idPrefix}-date`} className="px-1">
          {labelDate}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={`${idPrefix}-date`}
              className="w-32 justify-between font-normal"
            >
              {formatDisplayDate(date)}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(next) => {
                setDate(next);
                setOpen(false);
                emitChange(next, undefined);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor={`${idPrefix}-time`} className="px-1">
          {labelTime}
        </Label>
        <Input
          type="time"
          id={`${idPrefix}-time`}
          step="1"
          value={time}
          onChange={(e) => {
            const nextTime = e.target.value;
            setTime(nextTime);
            emitChange(date, nextTime);
          }}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}

export default DateTimePicker;


