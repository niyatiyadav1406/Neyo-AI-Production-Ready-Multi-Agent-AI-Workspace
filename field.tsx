import * as React from "react"

const Field = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="space-y-2" {...props}>{children}</div>
)
Field.displayName = "Field"

const FieldGroup = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="space-y-2" {...props}>{children}</div>
)
FieldGroup.displayName = "FieldGroup"

const FieldLabel = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>{children}</label>
)
FieldLabel.displayName = "FieldLabel"

const FieldControl = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input 
      ref={ref} 
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground ${className || ""}`}
      {...props}
    />
  )
)
FieldControl.displayName = "FieldControl"

const FieldDescription = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className="text-xs text-muted-foreground" {...props}>{children}</p>
)
FieldDescription.displayName = "FieldDescription"

const FieldError = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className="text-xs font-medium text-destructive" {...props}>{children}</p>
)
FieldError.displayName = "FieldError"

export { Field, FieldGroup, FieldLabel, FieldControl, FieldDescription, FieldError }
