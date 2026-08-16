import { describe, it, expect } from 'vitest'
import { SOURCE_TYPE_OPTIONS, LEGACY_JINJA2_OPTION } from './SurveyEditor'

describe('dynamic choices source types', () => {
  it('does not offer jinja2', () => {
    // The server renders that template in the web process, which made it a
    // code-execution path; it is refused unless an operator re-enables it in a
    // settings file. Offering it here would build a form that cannot be saved.
    expect(SOURCE_TYPE_OPTIONS.map((o) => o.value)).not.toContain('jinja2')
  })

  it('offers the source types the server accepts', () => {
    expect(SOURCE_TYPE_OPTIONS.map((o) => o.value)).toEqual(['db_query', 'api_endpoint'])
  })

  it('keeps a legacy entry so an existing jinja2 question stays visible', () => {
    // Without it the select would fall back to its first option and the
    // question would read as a Database Query it never was.
    expect(LEGACY_JINJA2_OPTION.value).toBe('jinja2')
    expect(LEGACY_JINJA2_OPTION.label).toMatch(/withdrawn/i)
  })
})
