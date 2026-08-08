<!--
Purpose:        Current session state — context handoff between agents
Owner:          Currently active agent
Update Trigger: Read at session start; must update before session ends
Harness Version: 1.1
-->

# Current Session — Signal Hub

## Session Info

- **Date**: 2026-08-07
- **Agent Role**: Documenter
- **Session Goal**: Draft accurate English and Korean GitHub-facing project descriptions from the
  shipped implementation and current public release state.

## Previous Session Summary

The project completed and published `csv-to-signal@0.2.1`. The public CLI supports local CSV
analysis, deterministic percentage-change and optional upward threshold signals, score filtering,
JSON output, and SQLite persistence. GitHub and CoinGecko connectors and windowed analysis remain
private workspace libraries and are not exposed through the CLI.

## Current Work

- [x] Reviewed the project constitution, current state, architecture, terminology, implementation
  plan, and English/Korean user documentation.
- [x] Prepared a Korean project description that distinguishes the Signal Hub engine from the
  published CSV to Signal CLI and avoids presenting deferred features as shipped functionality.
- [x] Refined the copy into concise English and Korean variants suitable for the GitHub repository
  About section.

## Completed This Session

- [x] Produced a reusable Korean introduction covering the problem, processing flow, key design
  properties, current scope, implementation stack, and intended users.
- [x] Produced matching one-sentence English and Korean GitHub descriptions.

## Issues Found / Decisions Made

- No new architecture decisions or project issues were introduced.
- The description uses “Signal Hub” for the overall project and “CSV to Signal” for the published
  `csv-to-signal` CLI package.

## Next Session: To-Do

1. Select and approve a focused M6 plan before expanding the public surface.
2. If the project description is adopted in repository documentation, tailor its length and tone
   to the target location before editing the relevant file.

## Important Context

- The public package is `csv-to-signal@0.2.1` and is available on npm.
- The CLI is the only public user-facing interface; workspace connector and analysis libraries are
  implemented but private.
- Deferred functionality must not be described as currently available.
