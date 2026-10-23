import { describe, expect, it } from 'vitest'
import { generateUuid } from './uuid'

describe('generateUuid', () => {
  it('generates a valid UUID string matching UUIDv7 format', () => {
    const id = generateUuid()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('generates unique identifiers across successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUuid()))
    expect(ids.size).toBe(100)
  })

  it('generates chronologically ordered identifiers', async () => {
    const first = generateUuid()
    // Small delay to ensure timestamp progression
    await new Promise((resolve) => setTimeout(resolve, 5))
    const second = generateUuid()
    expect(first < second).toBe(true)
  })
})
