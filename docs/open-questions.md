# Open Questions

These are the decisions already confirmed for the current phase:

1. The first release is mobile-only.
2. The app should remain local-first until the experience feels right in real use.
3. Weather should stay mocked until the UI and flows are stable.

## Remaining Questions

1. When we add on-device persistence, should deleted entries be hard-deleted or soft-deleted for future analytics?
2. When we expand notes later, do you want tags/prompts first, or longer free-form journaling first?

## Default Assumptions Used In This Scaffold

- Mobile-first product
- No authentication in the first build slice
- Mock weather service first, then swap to a live API later
- City-level context is enough for MVP
- Rule-based insights before any predictive modeling
- Edit and delete should exist in the local prototype
- Summary views focus on a 7-day window for now
- Notes remain lightweight and optional
