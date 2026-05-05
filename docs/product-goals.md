# Weathered Product Goals

## Product Vision

Weathered helps people understand whether external conditions like weather, time, and mood influence their decisions so they can act with more awareness and less regret.

## Core User Problem

Users often make repeat decisions without realizing the context driving them. This includes canceling plans on rainy days, avoiding work when energy is low, or making different spending choices depending on mood or time of day.

## MVP Goal

Answer one clear question well:

`Do I behave differently based on weather and mood?`

## Target User

- People interested in self-awareness and habit tracking
- Users who want low-friction daily reflection
- Users who prefer quick logging over journaling

## Product Principles

- Fast to log
- Insightful without being overwhelming
- Context captured automatically where possible
- Explanations should feel clear, lightweight, and useful
- Local-first during validation
- Structured so backend, sync, and intelligence can be layered in later

## MVP Success Criteria

- A user can log mood and a decision in under 30 seconds.
- Every event stores weather and time context.
- The app can generate at least one understandable rule-based insight from repeated behavior.
- The weekly summary gives users a clear sense of patterns across the week.

## MVP Scope

### 1. Mood Logging

- Mood score from 1 to 10
- Optional energy value: `low`, `medium`, `high`

### 2. Decision Logging

- Decision categories:
  - `social`
  - `work`
  - `spending`
  - `other`
- Common outcomes:
  - Social: `go_out`, `cancel`
  - Work: `work`, `skip`
  - Spending: `buy`, `avoid`
- Optional custom note for edge cases
- Edit and delete existing local entries

### 3. Context Capture

- Timestamp
- Weather condition
- Temperature
- Humidity
- City or coarse location label

### 4. Event Storage

Each event should capture:

- User identity
- Mood
- Energy
- Decision category
- Decision outcome
- Optional notes
- Weather snapshot
- Timestamp

### 5. Insights

- Rule-based pattern detection first
- Focus on plain-language summaries
- Example:
  - `You cancel social plans more often on rainy, low-mood days.`

### 6. Weekly Summary

- Number of logs
- Mood distribution
- Decision counts by category
- Simple context correlations
- Limited to the most recent 7 days in the first version

## Non-Goals For MVP

- Machine learning predictions
- Push notification optimization
- Wearable integrations
- Regret scoring
- Social sharing

## Initial Build Milestones

### Milestone 1: Foundations

- Monorepo setup
- Shared data contracts
- Mobile navigation and layout
- Local-only state model with mock context

### Milestone 2: Logging Loop

- Mood input UI
- Decision input UI
- Local history view
- Mock weather attachment

### Milestone 3: Insights

- Rule engine
- Insight cards after submission
- Weekly summary screen
- Editorial infographic summary treatment in `1.2`
- Local decision forecast cards in `1.3`
- Selectable local weather source modes in `1.4`

### Milestone 4: Persistence

- Local device persistence
- Stable local entry IDs for editing, deleting, and future sync
- Database-ready repository layer
- Optional sync architecture

## Expansion Path

### Near-Term

- Replace in-memory local state with on-device persistence
- Improve insight quality with streaks and repeated-pattern thresholds
- Expand lightweight notes into richer reflection when needed

### Later

- Introduce backend sync without changing the core event model
- Add authentication when multi-device access becomes important
- Swap mocked weather with a live provider once the UX stabilizes

## Risks And Watchouts

- Logging must stay fast or users will drop off.
- Weather capture depends on location permissions and provider reliability.
- Insights must be understandable even with low data volume.
