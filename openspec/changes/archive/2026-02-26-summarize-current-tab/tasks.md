## 1. Planning-to-code alignment

- [x] 1.1 Review existing side panel markup and handlers to map where the new summarize controls and status/output should be inserted.
- [x] 1.2 Identify existing tests (if any) and define/prepare TDD coverage for summarize generation, summary-only speech behavior, and empty/error cases.

## 2. Summarize current tab implementation

- [x] 2.1 Add a new “Summarize Current Tab” section in `sidepanel.html` with `Summarize` and `Read summary` buttons, status area, and summary textarea.
- [x] 2.2 Update `sidepanel.js` DOM bindings and state helpers for summarize status/output controls and button enable/disable behavior.
- [x] 2.3 Implement active-tab page-text extraction for summarization, including clear handling for inaccessible tabs or empty extracted text.
- [x] 2.4 Implement Prompt API summarization call that writes the generated summary into the summary textarea.

## 3. Summary-only speech behavior

- [x] 3.1 Implement `Read summary` flow so TTS speaks only the summary textarea content and never raw page text.
- [x] 3.2 Handle empty summary attempts with explicit user-facing status and without triggering TTS.
- [x] 3.3 Ensure summarize generation and summary speech both respect the current output language setting.

## 4. Verification

- [x] 4.1 Verification: confirm summarize success path on a normal webpage (summary appears, then Read summary speaks that summary only).
- [x] 4.2 Verification: confirm failure paths (restricted tab, extraction error, empty summary) show clear status and do not speak unintended content.
- [x] 4.3 Verification: confirm output language switching affects both generated summary output and spoken summary behavior.

## 5. Final verification by the user

- [x] 5.1 Final verification by the user: click Summarize on your target page and confirm the summary is written to the textarea.
- [x] 5.2 Final verification by the user: click Read summary and confirm only the summary text is spoken.
- [x] 5.3 Final verification by the user: switch output language and confirm summarize + read-summary behavior still works as expected.
