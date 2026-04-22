# Migration Plan: OpenAI ChatKit to Custom Backend

## Project Context
- Current application: OpenAI ChatKit starter app
- Goal: Replace OpenAI API dependency with custom backend
- Constraint: Maintain exact same UI/UX experience

## Current Architecture
- Frontend: Next.js app using `@openai/chatkit-react` library
- API: `/api/create-session/route.ts` calls OpenAI's ChatKit API
- Components: ChatKitPanel using useChatKit hook
- Environment: OPENAI_API_KEY + NEXT_PUBLIC_CHATKIT_WORKFLOW_ID

## Migration Strategy: Option A (Proxy Approach)

### Phase 1: Environment Setup
- [ ] Remove OPENAI_API_KEY dependency from environment
- [ ] Add CUSTOM_BACKEND_URL environment variable
- [ ] Add optional CUSTOM_API_KEY for backend authentication
- [ ] Update .env.example file

### Phase 2: API Route Modification
- [ ] Update `/api/create-session/route.ts` to act as proxy
- [ ] Implement request transformation to backend format
- [ ] Implement response transformation to ChatKit format
- [ ] Maintain error handling patterns
- [ ] Add logging for debugging proxy calls

### Phase 3: Backend Integration Testing
- [ ] Test session creation flow with custom backend
- [ ] Verify client_secret transformation works correctly
- [ ] Test error scenarios and fallbacks
- [ ] Validate session cookie handling

### Phase 4: UI Verification
- [ ] Confirm ChatKit UI loads correctly
- [ ] Verify chat functionality remains unchanged
- [ ] Test attachments and other advanced features
- [ ] Ensure theme switching and other UI interactions work

### Phase 5: Full Integration Testing
- [ ] End-to-end chat session testing
- [ ] Verify message history loading
- [ ] Test multiple concurrent sessions
- [ ] Performance testing of proxy layer

## Technical Requirements

### API Proxy Requirements
- Must accept same incoming format as original ChatKit requests
- Must return client_secret field compatible with ChatKit expectations
- Should handle authentication with custom backend
- Should maintain session state appropriately

### Response Transformation
- Map custom backend session identifiers to client_secret field
- Preserve expiration and other session metadata
- Handle backend-specific error responses appropriately

### Error Handling
- Maintain same error display behavior in UI
- Log proxy-specific errors for debugging
- Provide fallback mechanisms for backend outages

## Success Criteria
- [ ] UI remains completely unchanged for end users
- [ ] All ChatKit functionality works as before
- [ ] No dependency on OPENAI_API_KEY
- [ ] Application connects successfully to custom backend
- [ ] Session management works properly
- [ ] Error states handled appropriately

## Risk Mitigation
- Test in development environment first
- Maintain backup of original implementation
- Implement gradual rollout if possible
- Monitor for any unexpected UI behavior