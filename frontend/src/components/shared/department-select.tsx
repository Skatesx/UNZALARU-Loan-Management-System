import { useSchools } from '@/hooks/use-members'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DepartmentSelectProps {
  value: string | undefined
  onChange: (department: string) => void
  id?: string
  className?: string
}

/**
 * UNZA departments grouped by school. The member's school is worked out from
 * the department they pick, so reports can be filtered by school.
 */
export function DepartmentSelect({ value, onChange, id, className }: DepartmentSelectProps) {
  const { data: schools, isLoading } = useSchools()

  return (
    <Select value={value || ''} onValueChange={(v) => onChange(v || '')}>
      <SelectTrigger id={id} className={className ?? 'w-full'}>
        <SelectValue placeholder={isLoading ? 'Loading departments...' : 'Select your department'} />
      </SelectTrigger>
      <SelectContent>
        {(schools || []).map((s) => (
          <SelectGroup key={s.school}>
            <SelectLabel>{s.school}</SelectLabel>
            {s.departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
