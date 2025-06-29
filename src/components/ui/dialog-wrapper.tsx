import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { Button } from "./button"

interface DialogWrapperProps {
  triggerText?: string
  title?: string
  description?: string
  children?: React.ReactNode
}

export function DialogWrapper({
  triggerText = "Abrir Diálogo",
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  children
}: DialogWrapperProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
} 