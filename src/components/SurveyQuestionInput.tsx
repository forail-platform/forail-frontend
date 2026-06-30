import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { SurveyQuestion } from '@/api/types'

interface SurveyQuestionInputProps {
  question: SurveyQuestion
  value: unknown
  onChange: (val: unknown) => void
}

export function SurveyQuestionInput({ question, value, onChange }: SurveyQuestionInputProps) {
  const qType = question.type

  if (qType === 'multiplechoice') {
    const raw = question.choices
    const choices = Array.isArray(raw) ? raw : (raw || '').split('\n').filter(Boolean)
    const options = choices.map((c) => ({ value: c, label: c }))
    return (
      <Select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        options={[{ value: '', label: '-- Select --' }, ...options]}
      />
    )
  }

  if (qType === 'multiselect') {
    const raw = question.choices
    const choices = Array.isArray(raw) ? raw : (raw || '').split('\n').filter(Boolean)
    // A multiselect answer is an array of the chosen values, not a single string.
    const selected = Array.isArray(value) ? (value as string[]) : []
    const toggle = (choice: string) =>
      onChange(
        selected.includes(choice)
          ? selected.filter((c) => c !== choice)
          : [...selected, choice],
      )
    return (
      <div className="space-y-1">
        {choices.map((choice) => (
          <label key={choice} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(choice)}
              onChange={() => toggle(choice)}
            />
            {choice}
          </label>
        ))}
      </div>
    )
  }

  if (qType === 'textarea') {
    return (
      <Textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    )
  }

  if (qType === 'integer' || qType === 'float') {
    return (
      <Input
        type="number"
        value={String(value ?? '')}
        onChange={(e) => {
          // Empty / unparseable input must clear the answer, not store NaN.
          if (e.target.value === '') return onChange('')
          const n = qType === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value)
          onChange(Number.isNaN(n) ? '' : n)
        }}
        min={question.min ?? undefined}
        max={question.max ?? undefined}
      />
    )
  }

  if (qType === 'password') {
    return (
      <Input
        type="password"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <Input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
  )
}
