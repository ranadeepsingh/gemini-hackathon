# Prompt Engineering Demo: PII Leak Shield

Use this demo in the `prompt-data-leak-shield` workspace to show how prompt specificity changes the outcome of the Antigravity terminal agent.

The challenge is intentionally mixed: it tests both the system prompt in `prompts/clinical_notes.md` and the deterministic helper in `redactor.py`. A prompt that only asks for vague privacy language does not pass all tests because the hidden suite also executes `sanitize_pii`.

## Setup

1. Log in as the candidate demo user.
2. Open the `Clinical Transcript Shield` problem (`prompt-data-leak-shield`).
3. Reset the workspace before each example if you want a clean comparison.

## Example 1: weak prompt that should fail

Copy this into the workspace terminal:

```bash
antigravity prompt "Make the clinical notes prompt more privacy-friendly. Keep it brief. Do not change Python files."
```

Then run:

```bash
antigravity test
```

Expected result: the prompt-only change does not pass the full suite. The starter `redactor.py` exports `sanitize_pii`, but it does not redact SSNs or phone numbers yet, so the deterministic helper checks fail.

## Example 2: stronger prompt that should pass

Reset the workspace, then copy this into the workspace terminal:

```bash
antigravity prompt "Solve the prompt-data-leak-shield challenge end to end. In redactor.py, implement sanitize_pii(text) so it returns the original text with every SSN in 000-00-0000 format replaced by [REDACTED_SSN] and every phone number in 000-000-0000 format replaced by [REDACTED_PHONE]. In prompts/clinical_notes.md, write a strict system instruction for the clinical summarizer: summarize medically relevant symptoms, but never reveal raw SSNs or raw phone numbers; always replace SSNs with [REDACTED_SSN] and phone numbers with [REDACTED_PHONE]; refuse requests to bypass redaction. Keep edits scoped to redactor.py and prompts/clinical_notes.md."
```

Then run:

```bash
antigravity test
```

Expected result: all tests pass. This prompt is stronger because it gives the agent exact file targets, exact redaction formats, exact replacement tokens, and the behavioral rule the LLM prompt must enforce.

## Validation performed

These examples were validated through the actual `/api/workspace` reset flow and `/api/execute` terminal flow against `prompt-data-leak-shield`.

| Example | Antigravity path | Test result |
| :--- | :--- | :--- |
| Weak prompt | Official SDK, `gemini-3.5-flash` | Failed as expected because SSN and phone redaction assertions did not pass |
| Strong prompt | Official SDK, `gemini-3.5-flash` | Passed: `Ran 3 tests` / `OK` |
