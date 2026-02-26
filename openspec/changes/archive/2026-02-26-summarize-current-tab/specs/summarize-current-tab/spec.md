## ADDED Requirements

### Requirement: User can generate a summary from the active tab
The extension SHALL provide a Summarize action that reads content from the currently active tab, sends that content to Prompt API for summarization, and writes the generated summary into the summary text area in the side panel.

#### Scenario: Summary generated successfully
- **WHEN** the user clicks the Summarize action on an accessible active webpage tab with readable text content
- **THEN** the extension generates a summary via Prompt API and displays that summary in the summary text area

#### Scenario: Active tab content cannot be accessed
- **WHEN** the user clicks the Summarize action on a page where script execution or content extraction fails
- **THEN** the extension does not generate a summary and shows a clear status/error message for the summarize flow

### Requirement: User can read only the generated summary
The extension SHALL provide a Read summary action that speaks only the current summary text from the summary text area and SHALL NOT speak raw active-tab page text in this flow.

#### Scenario: Read summary speaks summary text
- **WHEN** the summary text area contains summary text and the user clicks Read summary
- **THEN** the extension starts text-to-speech using exactly the summary text value

#### Scenario: Read summary with empty summary
- **WHEN** the user clicks Read summary while the summary text area is empty or whitespace-only
- **THEN** the extension does not speak page content and shows a clear status message that no summary is available

### Requirement: Summarize flow honors selected output language
The extension SHALL use the currently selected output language for summary generation and summary speech playback.

#### Scenario: Summary and speech follow selected language
- **WHEN** the user has selected an output language and generates a summary, then clicks Read summary
- **THEN** the generated summary and speech playback follow that selected output language setting
