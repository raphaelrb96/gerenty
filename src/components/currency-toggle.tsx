
"use client"

import * as React from "react"
import { CircleDollarSign } from "lucide-react"
import { useCurrency } from "@/context/currency-context"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function CurrencyToggle() {
  const { setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <CircleDollarSign className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle currency</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setCurrency('BRL')}>
          BRL (R$)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency('USD')}>
          USD ($)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency('EUR')}>
          EUR (€)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
