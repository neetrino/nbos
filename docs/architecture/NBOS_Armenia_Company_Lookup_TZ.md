# TZ: Armenia Company Lookup by TIN for NBOS

## Goal

Add a simple company requisites lookup to NBOS for Armenian legal entities.

The user enters an Armenian TIN / ՀՎՀՀ (ИНН), and NBOS retrieves the main publicly available company requisites and fills the company form.

Keep the first version minimal. Do not add unnecessary infrastructure or over-engineering.

## Before implementation

1. Inspect the current NBOS architecture, company/client forms, backend modules, API conventions, validation, error handling, and existing documentation.
2. Check whether the project already has any company/requisites lookup integration or reusable provider/service.
3. Verify the current official or legally accessible Armenian source that can return public company data by TIN.
4. Confirm the actual request/response format and which fields are really available before writing the integration.
5. Only after verification, implement the simplest reliable solution.

Important:

- Prefer an official/publicly accessible source.
- Do not invent endpoints, response fields, credentials, or data.
- Do not add ADEL/X-Road infrastructure in this task unless it is strictly required for the chosen working source.
- Do not build a complex universal multi-country provider system for this first version.
- Do not scrape pages if a stable public API/service is available.
- If the official source cannot be used automatically without credentials/access, clearly document that limitation before implementing a workaround.

## V1 functionality

### UI

In the company/requisites form add a TIN / ՀՎՀՀ field and a simple lookup action.

Flow:

1. User enters TIN, for example `00161665`.
2. User clicks Search / Find company.
3. Frontend calls the NBOS backend.
4. Backend requests company data from the verified Armenian source.
5. If the company is found, fill the available requisites automatically.
6. User can review/edit the filled values before saving.

No automatic save.

### Main fields to retrieve

Return only fields that are actually available from the source:

- TIN / ՀՎՀՀ
- Company legal name
- Legal form, if available
- State registration number, if available
- Legal/registered address
- Registration date, if available
- Company status / active-inactive status, if available

Optional only if easily available from the same response:

- activity/industry code
- phone
- email
- website

Do not expand the scope to owners, beneficiaries, directors, financial data, court data, or other advanced information in V1.

## Backend

Create a small backend service/module following the existing NBOS architecture.

Suggested endpoint:

`GET /api/companies/lookup-by-tin/:tin`

or use the existing project API naming convention if different.

Example normalized response:

```json
{
  "tin": "00161665",
  "name": "Company Name LLC",
  "legalForm": "LLC",
  "registrationNumber": "123.456.789",
  "registeredAddress": "Yerevan, ...",
  "registrationDate": "2020-01-01",
  "status": "ACTIVE"
}
```

The normalized NBOS response must not expose unnecessary raw provider-specific structures to the frontend.

## Validation and errors

Handle at least:

- empty TIN
- invalid TIN format
- company not found
- external service unavailable
- timeout
- malformed external response

Return normal NBOS API errors and show a clear frontend message.

Do not crash company creation/editing if the lookup service is unavailable.

## Implementation rules

- Reuse the current HTTP client/config/env patterns already used in NBOS.
- Keep secrets/configuration on the backend only.
- Do not call the Armenian external service directly from the browser.
- Add no new database tables unless they are genuinely necessary.
- No Redis, queue, worker, cron, or background job is needed for V1.
- No automatic synchronization is needed.
- No complex caching is required. If the project already has a simple cache helper, it may be reused.
- Follow the existing code style and module boundaries.
- Do not refactor unrelated code.

## Verification

Before considering the task complete:

1. Test lookup with at least one known valid Armenian TIN.
2. Test an invalid/non-existing TIN.
3. Test external service failure.
4. Verify that returned values correctly map to the company form.
5. Verify that the user can edit autofilled values before saving.
6. Verify no sensitive credentials are exposed to the frontend.
7. Run relevant lint/typecheck/tests.

## Documentation

If NBOS has documentation for integrations or company/requisites functionality, update the relevant existing document briefly.

Document:

- which Armenian source is used
- endpoint/configuration used
- required environment variables, if any
- known limitations

Do not create unnecessary new documentation files if an appropriate existing document already exists.

## Definition of Done

The task is complete when:

- entering an Armenian TIN can retrieve the main public company requisites;
- the fields are automatically filled in the NBOS company form;
- the implementation uses a verified working source;
- invalid/not-found/service-error cases are handled cleanly;
- no unnecessary infrastructure or unrelated refactoring was introduced.
