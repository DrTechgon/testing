# TODO: Add Language Selection to ChatWidget

## Tasks
- [x] Add language selector dropdown in ChatWidget header (English/Hindi)
- [x] Update ChatWidget state to track selected language
- [x] Modify ChatWidget to send language in request body to /api/chat
- [x] Update src/app/api/chat/route.ts to forward language parameter to backend
- [x] Modify backend/app_api.py /api/chat endpoint to accept and use optional language parameter
- [x] Add CSS styles for language selector
- [ ] Test language selection functionality
- [ ] Verify LLM responses respect selected language
- [ ] Handle edge cases (invalid language codes, fallback to auto-detection)
