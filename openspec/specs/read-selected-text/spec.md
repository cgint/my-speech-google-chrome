# read-selected-text Specification

## Purpose
TBD - created by archiving change read-selected-text-active-tab. Update Purpose after archive.
## Requirements
### Requirement: User can read selected text from the active tab
The extension SHALL provide a user action that retrieves the current text selection from the active tab and reads that text aloud using extension text-to-speech.

#### Scenario: Read selected text successfully
- **WHEN** the user has selected text in the active tab and triggers the read-selected-text action
- **THEN** the extension retrieves the selected text from the active tab and starts speaking that exact text

### Requirement: Extension handles empty selection explicitly
The extension SHALL detect when the active tab has no non-whitespace selection and SHALL not start speech in that case.

#### Scenario: No selected text available
- **WHEN** the user triggers the read-selected-text action and the active tab selection is empty or whitespace-only
- **THEN** the extension does not call text-to-speech for selection playback and shows a clear user-facing message indicating that no text is selected

### Requirement: Extension reports inaccessible tab-selection context
The extension SHALL surface an explicit error message when selection retrieval cannot run in the active tab context.

#### Scenario: Selection cannot be read from the page
- **WHEN** the user triggers the read-selected-text action on a page where script execution is blocked or fails
- **THEN** the extension does not start selection playback and shows a clear user-facing message that selected text cannot be accessed on the current page

