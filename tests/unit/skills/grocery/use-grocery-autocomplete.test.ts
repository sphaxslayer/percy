/**
 * Unit tests for the grocery autocomplete composable.
 * Tests input parsing logic and suggestion behavior.
 */
import { describe, it, expect } from 'vitest'
import { parseItemInput } from '~/composables/use-grocery-autocomplete'

describe('parseItemInput', () => {
  it('returns name and default quantity for plain text', () => {
    expect(parseItemInput('Lait')).toEqual({ name: 'Lait', quantity: 1 })
  })

  it('returns empty name for empty input', () => {
    expect(parseItemInput('')).toEqual({ name: '', quantity: 1 })
  })

  it('trims whitespace', () => {
    expect(parseItemInput('  Lait  ')).toEqual({ name: 'Lait', quantity: 1 })
  })

  it('parses "name x6" format', () => {
    expect(parseItemInput('Bananes x6')).toEqual({ name: 'Bananes', quantity: 6 })
  })

  it('parses "name × 6" format (unicode multiply)', () => {
    expect(parseItemInput('Bananes × 6')).toEqual({ name: 'Bananes', quantity: 6 })
  })

  it('parses "name X3" format (uppercase)', () => {
    expect(parseItemInput('Yaourts X3')).toEqual({ name: 'Yaourts', quantity: 3 })
  })

  it('parses "name 2kg" format (quantity + unit)', () => {
    expect(parseItemInput('Tomates 2kg')).toEqual({ name: 'Tomates', quantity: 2, unit: 'kg' })
  })

  it('parses "name 2 kg" format (quantity + space + unit)', () => {
    expect(parseItemInput('Tomates 2 kg')).toEqual({ name: 'Tomates', quantity: 2, unit: 'kg' })
  })

  it('parses "name 2L" format', () => {
    expect(parseItemInput('Lait 2L')).toEqual({ name: 'Lait', quantity: 2, unit: 'L' })
  })

  it('parses "name 6" format (trailing number)', () => {
    expect(parseItemInput('Oeufs 6')).toEqual({ name: 'Oeufs', quantity: 6 })
  })

  it('handles multi-word product names', () => {
    expect(parseItemInput('Pain de mie x2')).toEqual({ name: 'Pain de mie', quantity: 2 })
  })

  it('handles "name x6unit" format', () => {
    expect(parseItemInput('Lait x2L')).toEqual({ name: 'Lait', quantity: 2, unit: 'L' })
  })
})
