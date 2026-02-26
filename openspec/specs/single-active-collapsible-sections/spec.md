# single-active-collapsible-sections Specification

## Purpose
TBD - created by archiving change single-active-collapsible-sections. Update Purpose after archive.
## Requirements
### Requirement: Side-panel sections behave as a single-active accordion
The extension SHALL render top-level feature sections as collapsible panels and SHALL ensure that at most one section is open at any time.

#### Scenario: Opening one section collapses others
- **WHEN** a user opens a collapsed top-level section
- **THEN** that section becomes expanded and all other top-level sections become collapsed
- **AND** the user can interact with controls only in the currently expanded section.

#### Scenario: Expanding any section requires explicit user intent
- **WHEN** the user clicks a section header while the section is collapsed
- **THEN** that section expands and the extension records it as the active section.

### Requirement: Default and programmatic active section behavior
The extension SHALL open a deterministic default section on first render and SHALL open the associated section when a user triggers an action in it.

#### Scenario: Deterministic initial state
- **WHEN** the side panel first loads
- **THEN** exactly one top-level feature section is expanded by default.

#### Scenario: Action-triggered section activation
- **WHEN** the user triggers a feature action inside a section (record, read selected text, summarize)
- **THEN** that section is expanded even if it was previously collapsed.

#### Scenario: No empty multiple-open state
- **WHEN** the active section is changed by user action or header click
- **THEN** no more than one top-level section is expanded at the end of the interaction.

