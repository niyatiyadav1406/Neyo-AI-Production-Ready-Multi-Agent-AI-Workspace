import * as React from "react"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

const Select = ({ children }: SelectProps) => <div>{children}</div>
Select.displayName = "Select"

const SelectTrigger = ({ children, className }: any) => (
  <div className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ${className || ""}`}>
    {children}
  </div>
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: any) => (
  <span>{placeholder || "Select..."}</span>
)
SelectValue.displayName = "SelectValue"

const SelectContent = ({ children }: any) => (
  <div className="mt-2 rounded-md border border-input bg-background shadow-md">
    {children}
  </div>
)
SelectContent.displayName = "SelectContent"

const SelectItem = ({ children, value, onSelect, onClick }: any) => (
  <div
    onClick={() => {
      onSelect?.(value)
      onClick?.()
    }}
    className="cursor-pointer px-3 py-2 hover:bg-accent"
  >
    {children}
  </div>
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
