// Example: the "lazy expiry" read pattern for turning a stored subscription
// row into the plan a user actually has access to right now — no cron job
// needed. Handles cancellation-with-remaining-access, payment failures, and
// renewals uniformly. See ../references/subscriptions-guide.md for the why.

interface UserSubRow {
  sub: "free" | "plus" | "pro" | "max"; // last known tier from webhooks
  current_period_end: Date | null; // from BachsSubscription.current_period_end
}

export function getEffectivePlan(user: UserSubRow): UserSubRow["sub"] {
  if (user.sub === "free") return "free";
  if (!user.current_period_end) return "free"; // no active period on record
  if (user.current_period_end.getTime() < Date.now()) return "free"; // lapsed
  return user.sub;
}

// Usage in a plan-status endpoint:
//
//   const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
//   const plan = getEffectivePlan(row);
//
// This means webhook handlers only need to keep `sub` and
// `current_period_end` in sync with the latest Bachs subscription object —
// they never need to eagerly flip anyone to "free" themselves. A canceled
// subscription with cancel_at_period_end=true simply keeps its existing
// current_period_end until the customer.subscription.deleted event updates
// it, so access naturally continues until then.
