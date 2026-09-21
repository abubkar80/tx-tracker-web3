export function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string') return err
  return 'Unexpected error'
}

export function isUserRejected(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = 'code' in err ? err.code : undefined
  return code === 4001 || code === 'ACTION_REJECTED'
}
