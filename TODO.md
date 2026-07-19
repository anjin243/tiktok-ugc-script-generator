# TODO

- Rotate any real credential that may appear in `backend/.env`, then untrack it and consider history cleanup only with owner approval.
- Decide whether production uses the mock generator or hardened provider-backed routes.
- Move AI credentials out of browser `localStorage`; encrypt server-side secrets.
- Add authentication, authorization, rate limiting, upload validation, and safe provider errors.
- Implement or remove unsupported `/api/ai/recommend-selling-points` and multipart upload calls.
- Align `.cloudstudio` frontend port with Vite 5174.
- Add end-to-end startup/API contract tests.
- Review current TikTok Shop Malaysia policy before production publishing.
