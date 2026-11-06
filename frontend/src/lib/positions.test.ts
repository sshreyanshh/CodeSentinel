import { describe, expect, it } from 'vitest'
import { codePointColumnToMonaco } from './positions'

describe('codePointColumnToMonaco', () => {
  it('keeps ASCII columns unchanged', () => {
    expect(codePointColumnToMonaco('hello', 3)).toBe(3)
  })

  it('counts surrogate pairs as two UTF-16 code units', () => {
    expect(codePointColumnToMonaco('a😀b', 3)).toBe(4)
  })

  it('counts tabs as one code point', () => {
    expect(codePointColumnToMonaco('a\tb', 3)).toBe(3)
  })

  it('returns the column after the final character at end-of-line', () => {
    expect(codePointColumnToMonaco('a😀', 3)).toBe(4)
  })

  it('clamps columns beyond the end of the line', () => {
    expect(codePointColumnToMonaco('a😀', 10)).toBe(4)
  })

  it('returns the first column for an empty line', () => {
    expect(codePointColumnToMonaco('', 1)).toBe(1)
  })
})
