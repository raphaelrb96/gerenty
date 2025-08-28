
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/context/i18n-context"

export function CurrencyToggle() {
  const { setCurrency, currency } = useCurrency();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8">
          <CircleDollarSign className="h-[1.2rem] w-[1.2rem] mr-2" />
          <span>{t('preferencesPage.currency')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('preferencesPage.selectCurrency')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setCurrency('USD')}>
          USD ($)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency('BRL')}>
          BRL (R$)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency('EUR')}>
          EUR (€)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
