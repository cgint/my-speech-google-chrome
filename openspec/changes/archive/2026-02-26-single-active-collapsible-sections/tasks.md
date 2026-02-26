## 1. Test Discovery and TDD Planning

- [x] 1.1 Inspect existing extension test setup and decide the minimal TDD scope for collapsible section behavior.
- [x] 1.2 Define TDD scenarios for: single-open enforcement, default open behavior, and action-triggered section activation.

## 2. UI Markup and Style Changes

- [x] 2.1 Update `sidepanel.html` to mark each top-level feature section as a collapsible section with a clickable header.
- [x] 2.2 Set the deterministic default open section in the markup.
- [x] 2.3 Add/adjust `sidepanel.css` styles for collapsed and expanded states, ensuring readability in the compact panel.

## 3. Interaction Logic

- [x] 3.1 Implement single-active accordion logic in `sidepanel.js` so opening one section closes all others.
- [x] 3.2 Wire action triggers (`btnRecord`, `btnReadSelection`, `btnSummarizeTab`) to auto-open their parent section when invoked.
- [x] 3.3 Preserve existing status and action behavior while preventing regressions from collapsed sections.

## 4. Verification

- [x] 4.1 Verification: Confirm only one top-level section is open after the user opens another section.
- [x] 4.2 Verification: Confirm default state opens exactly one section on initial load.
- [x] 4.3 Verification: Confirm action buttons inside collapsed sections expand that section before or during action handling.
- [x] 4.4 Verification: Confirm all existing feature flows (record, read selected text, summarize, read summary, stop actions) still function.

## 5. Final verification by the user

- [x] 5.1 Final verification by the user: Load the extension, expand a section, and verify that other sections collapse.
- [x] 5.2 Final verification by the user: Trigger each feature and confirm the relevant section remains visible with controls and output.
- [x] 5.3 Final verification by the user: Confirm no section unexpectedly reopens multiple sections at once.