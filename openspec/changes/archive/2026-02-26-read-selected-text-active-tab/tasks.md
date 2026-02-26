## 1. Test Baseline and TDD Planning

- [x] 1.1 Identify existing extension tests (if any) and define the TDD scope for selected-text read-aloud behavior.
- [x] 1.2 Add or outline failing test cases for: successful selection read, empty selection handling, and inaccessible-page handling.

## 2. Selection Read-Aloud Implementation

- [x] 2.1 Add UI trigger in the side panel for “Read selected text” and wire it to a dedicated handler.
- [x] 2.2 Implement active-tab selection retrieval using script execution in page context and normalize returned text.
- [x] 2.3 Reuse current TTS flow to speak retrieved text and show clear status updates for success and failure states.
- [x] 2.4 Update extension permissions/config needed for active-tab selection retrieval.

## 3. Edge-Case and Error Handling

- [x] 3.1 Handle empty/whitespace selections by preventing speech and showing a clear “no text selected” message.
- [x] 3.2 Handle blocked/inaccessible tabs by showing a clear message that selected text cannot be accessed on the current page.
- [x] 3.3 Ensure the new flow does not break or regress the existing recording/transcription side-panel workflow.

## 4. Verification

- [x] 4.1 Verification: Confirm selected text is spoken exactly as selected on a regular webpage.
- [x] 4.2 Verification: Confirm no speech starts and an informative message is shown when nothing is selected.
- [x] 4.3 Verification: Confirm blocked-page behavior shows informative error feedback without extension crashes.
- [x] 4.4 Verification: Confirm existing STT → AI → TTS loop still works unchanged after the new feature.

## 5. Final verification by the user

- [x] 5.1 Final verification by the user: Select text on a normal webpage, trigger the feature, and confirm the spoken output matches the selected text.
- [x] 5.2 Final verification by the user: Trigger the feature with no selection and confirm the extension clearly explains what to do.
- [x] 5.3 Final verification by the user: Trigger the feature on a restricted page and confirm a clear, non-technical error message is shown.
