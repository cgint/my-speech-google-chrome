# Selected Text Read-Aloud — TDD Notes

## Existing test baseline
- No automated test framework or existing test files were found in the current extension repository.
- Current verification is primarily manual (build + load unpacked extension + run browser interactions).

## Failing-test intent (TDD scope)
The following behaviors should be captured as failing tests first once an automated harness is introduced:

1. Read selected text successfully
   - Given an active tab with selected text
   - When user triggers "Read selected text"
   - Then extension requests selection from tab context and calls TTS with exactly that text

2. Empty selection
   - Given an active tab without a non-whitespace selection
   - When user triggers "Read selected text"
   - Then extension does not call TTS and surfaces a clear "no text selected" message

3. Inaccessible tab context
   - Given an active tab where script execution is blocked
   - When user triggers "Read selected text"
   - Then extension does not call TTS and surfaces a clear inaccessible-page message
