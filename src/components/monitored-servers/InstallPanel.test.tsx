import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { InstallPanel, formatCountdown, secondsLeft } from './InstallPanel'
import type { EnrollmentCode } from '@/api/types'

const NOW = Date.parse('2026-11-12T10:00:00Z')

function code(secondsFromNow: number): EnrollmentCode {
  return {
    code: 'fme_abc123',
    expires_at: new Date(NOW + secondsFromNow * 1000).toISOString(),
    api_url: 'https://mobile.example.com',
    command: 'sudo forail-agent enroll --api https://mobile.example.com --code fme_abc123',
  }
}

describe('countdown helpers', () => {
  it('counts whole seconds and never goes below zero', () => {
    expect(secondsLeft(new Date(NOW + 90_500).toISOString(), NOW)).toBe(90)
    expect(secondsLeft(new Date(NOW - 5_000).toISOString(), NOW)).toBe(0)
    expect(secondsLeft('not a date', NOW)).toBe(0)
  })

  it('formats minutes and seconds', () => {
    expect(formatCountdown(600)).toBe('10:00')
    expect(formatCountdown(61)).toBe('1:01')
    expect(formatCountdown(0)).toBe('0:00')
  })
})

describe('InstallPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks for a code before showing any command', () => {
    const onIssue = vi.fn()
    render(<InstallPanel code={null} onIssue={onIssue} isIssuing={false} canIssue />)
    expect(screen.queryByTestId('install-command')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /issue enrollment code/i }))
    expect(onIssue).toHaveBeenCalledOnce()
  })

  it('shows the command and a countdown that runs out', () => {
    render(<InstallPanel code={code(600)} onIssue={vi.fn()} isIssuing={false} canIssue />)
    expect(screen.getByTestId('install-command')).toHaveTextContent('sudo forail-agent enroll --api https://mobile.example.com --code fme_abc123')
    expect(screen.getByTestId('countdown')).toHaveTextContent('10:00')

    act(() => {
      vi.advanceTimersByTime(61_000)
    })
    expect(screen.getByTestId('countdown')).toHaveTextContent('8:59')

    act(() => {
      vi.advanceTimersByTime(540_000)
    })
    expect(screen.queryByTestId('install-command')).not.toBeInTheDocument()
    expect(screen.getByTestId('code-expired')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /issue a new code/i })).toBeInTheDocument()
  })

  it('copies the command, not anything else', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<InstallPanel code={code(600)} onIssue={vi.fn()} isIssuing={false} canIssue />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy command/i }))
    })
    expect(writeText).toHaveBeenCalledWith('sudo forail-agent enroll --api https://mobile.example.com --code fme_abc123')
    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
  })

  it('never shows a long-lived agent token', () => {
    const { container } = render(<InstallPanel code={code(600)} onIssue={vi.fn()} isIssuing={false} canIssue />)
    expect(container.textContent).not.toMatch(/fma_/)
  })

  it('offers no button to someone who may not issue codes', () => {
    render(<InstallPanel code={null} onIssue={vi.fn()} isIssuing={false} canIssue={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(/only the owner and the admins/i)).toBeInTheDocument()
  })
})
