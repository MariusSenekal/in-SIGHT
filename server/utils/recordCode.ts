// Shared QR record code generator - used by both the single-record create
// endpoint and bulk import, so codes stay in the same REC-XXXXXX format and
// collision-checking logic doesn't drift between the two call sites.
import { pgrestAdmin } from './pgrest'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const generateRecordCode = (): string => {
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return `REC-${suffix}`
}

/** Generates a batch of `count` unique, not-yet-used record codes. */
export const generateUniqueRecordCodes = async (count: number): Promise<string[]> => {
  const codes = new Set<string>()
  while (codes.size < count) {
    codes.add(generateRecordCode())
  }

  const candidates = [...codes]
  const existing = await pgrestAdmin<Array<{ code: string }>>('/records', {
    query: { code: `in.(${candidates.join(',')})`, select: 'code' }
  })
  const taken = new Set((existing ?? []).map(r => r.code))

  if (taken.size === 0) return candidates

  const retryCount = taken.size
  const fresh = await generateUniqueRecordCodes(retryCount)
  const freshIter = fresh[Symbol.iterator]()
  return candidates.map(code => taken.has(code) ? freshIter.next().value as string : code)
}
