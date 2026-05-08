/** Canonicalize a pair so (a, b) and (b, a) map to the same Match row. */
export function canonicalPair(userIdA: string, userIdB: string): { userAId: string; userBId: string } {
  return userIdA < userIdB
    ? { userAId: userIdA, userBId: userIdB }
    : { userAId: userIdB, userBId: userIdA };
}
