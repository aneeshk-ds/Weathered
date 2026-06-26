# Weathered User Validation Plan

Weathered should be tested with 3-5 target users before calling the product complete.

## Goal

Confirm that a first-time user can understand Weathered, complete the core check-in, and see value without hand-holding.

## Target Testers

Use people who match at least one of these profiles:

- interested in self-awareness or habit tracking
- wants quick reflection without long journaling
- often notices mood, energy, or weather affecting decisions

## Test Setup

- Use a physical Android device with the latest APK.
- Start with a fresh app install when possible.
- Do not explain the app beyond: "This app helps you notice how mood, weather, and energy affect decisions."
- Observe silently unless the tester gets fully stuck.

## Core Tasks

Ask each tester to:

1. Open Weathered and explain what they think it is for.
2. Complete one mood, energy, and decision check-in.
3. Find the saved check-in in History.
4. Edit or delete the check-in.
5. Open Insights and explain what the app is telling them.
6. Open Settings and find how to back up or clear data.

## What To Record

For each tester, record:

- time to first check-in
- whether they completed the check-in without help
- where they hesitated
- words or labels they found confusing
- whether Insights felt useful
- whether data/privacy behavior felt clear
- bugs or visual layout issues
- one thing they expected but did not find

## Pass Criteria

Weathered passes first-user validation when:

- at least 4 of 5 testers complete a check-in without help
- median time to first check-in is under 2 minutes
- at least 4 of 5 testers understand that data is local-first
- no tester hits a blocker bug in Home, History, Insights, or Settings
- no repeated confusion appears across 2 or more testers without a fix plan

## Results

| Tester | Device | Time to first check-in | Needed help? | Main confusion | Insight useful? | Blocker bug? | Notes |
|---|---|---:|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |

## Decision

- Validation status: `not started`
- Release decision: do not call Weathered complete until this table has real results.
- Follow-up fixes:
  - 
