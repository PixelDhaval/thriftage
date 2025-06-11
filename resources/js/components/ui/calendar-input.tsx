import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CalendarInputProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function CalendarInput({
  value,
  onChange,
  className,
  placeholder = "Pick a date",
  disabled,
  id
}: CalendarInputProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          disabled={disabled}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}