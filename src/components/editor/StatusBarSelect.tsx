import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronUp } from 'lucide-react'

interface StatusBarSelectProps {
  value: string
  options: readonly (readonly [string, string])[]
  onChange: (value: string) => void
}

/** A VS Code–style language selector that lives in the editor footer status bar. */
export function StatusBarSelect({ value, options, onChange }: StatusBarSelectProps) {
  const label = options.find(([k]) => k === value)?.[1] ?? value

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-full cursor-pointer items-center gap-1 px-3 outline-none hover:bg-black/20 whitespace-nowrap">
          {label}
          <ChevronUp className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={4}
          className="z-50 min-w-[160px] overflow-hidden rounded border border-[#3c3c3c] bg-[#1e1e1e] py-1 shadow-lg"
        >
          {options.map(([k, v]) => (
            <DropdownMenu.Item
              key={k}
              onSelect={() => onChange(k)}
              className="flex h-7 cursor-pointer items-center px-2 text-[13px] text-[#cccccc] outline-none data-[highlighted]:bg-[#0078d4] data-[highlighted]:text-white"
            >
              <span className="mr-2 w-4 shrink-0">
                {k === value && <Check className="h-3 w-3" />}
              </span>
              {v}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
