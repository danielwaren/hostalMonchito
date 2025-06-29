import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

interface CollapsibleProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> {}

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleProps
>((props, ref) => <CollapsiblePrimitive.Root ref={ref} {...props} />)
Collapsible.displayName = CollapsiblePrimitive.Root.displayName

interface CollapsibleTriggerProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger> {}

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  CollapsibleTriggerProps
>((props, ref) => <CollapsiblePrimitive.CollapsibleTrigger ref={ref} {...props} />)
CollapsibleTrigger.displayName = CollapsiblePrimitive.CollapsibleTrigger.displayName

interface CollapsibleContentProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent> {}

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  CollapsibleContentProps
>((props, ref) => <CollapsiblePrimitive.CollapsibleContent ref={ref} {...props} />)
CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
