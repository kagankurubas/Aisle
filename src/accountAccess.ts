export function canUseAccount<
  T extends { emailVerified: boolean; isAnonymous?: boolean },
>(user: T | null | undefined): user is T {
  return Boolean(user && (user.emailVerified || user.isAnonymous === true));
}
