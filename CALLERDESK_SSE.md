# CallerDesk SSE Integration

## Overview

This integration enables real-time call status updates in the CRM using Server-Sent Events (SSE) via tRPC subscriptions.

## Features Implemented

### 1. Event Emitter (`src/lib/call-events.ts`)

- EventEmitter instance to broadcast call events across the application
- Supports two event types:
  - `live_call`: Emitted when a call is in progress
  - `call_completed`: Emitted when a call ends

### 2. CallerDesk Webhook Updates (`src/app/api/callerdesk/webhook/route.ts`)

- Enhanced webhook to emit real-time events
- Handles both `live_call` and `call_report` event types from CallerDesk
- Emits events with workspace filtering for multi-tenant support

### 3. tRPC Subscription (`src/server/api/routers/call.ts`)

- New `onCallEvent` subscription procedure
- Filters events by workspace ID for security
- Uses tRPC's `observable` for streaming updates

### 4. Client-Side Integration (`src/trpc/react.tsx`)

- Added `httpSubscriptionLink` for SSE support
- Split link to handle subscriptions separately from queries/mutations
- Maintains backward compatibility with existing API calls

### 5. Call Completed Popup (`src/components/call-completed-popup.tsx`)

- Beautiful dialog showing call details
- Auto-closes after 10 seconds
- Displays:
  - Call status (Completed, No Answer, Busy, Failed)
  - Call duration
  - Contact information
  - Recording URL (if available)
- Status badges with color coding

### 6. Campaign Work Page Integration (`src/app/dashboard/campaigns/[id]/work/page.tsx`)

- Subscribes to call events for the current workspace
- Shows toast notification for live calls
- Opens popup dialog for completed calls
- Auto-refreshes campaign data after call completion

## How It Works

1. **Agent initiates call** → CallerDesk API is called
2. **CallerDesk sends webhook** (`live_call` type)
3. **Webhook emits event** → Event emitter broadcasts to subscribers
4. **tRPC subscription** → Pushes event to connected clients in the same workspace
5. **UI updates** → Toast notification shows "Call in progress..."
6. **Call ends** → CallerDesk sends webhook (`call_report` type)
7. **Webhook creates Call record** and emits `call_completed` event
8. **UI updates** → Popup dialog shows call details, auto-refreshes data

## Testing

### Manual Testing

1. Navigate to a campaign work page: `/dashboard/campaigns/[id]/work`
2. Click "Call Now" button on a lead
3. You should see:
   - Toast notification: "Call in progress..."
   - After call ends: Popup with call details
   - Auto-closes after 10 seconds

### Using CallerDesk Webhook

Send a POST request to `/api/callerdesk/webhook` with:

**Live Call Event:**

```json
{
  "type": "live_call",
  "SourceNumber": "1234567890",
  "DestinationNumber": "9876543210",
  "Status": "Picked"
}
```

**Call Completed Event:**

```json
{
  "type": "call_report",
  "SourceNumber": "1234567890",
  "DestinationNumber": "9876543210",
  "DialWhomNumber": "9876543210",
  "CallDuration": "120",
  "Status": "ANSWER",
  "CallRecordingUrl": "https://example.com/recording.mp3",
  "Direction": "WEBOBD",
  "StartTime": "2024-01-01T10:00:00Z",
  "EndTime": "2024-01-01T10:02:00Z"
}
```

## Technical Notes

### Workspace Isolation

- Events are filtered by `workspaceId` to ensure users only see calls from their workspace
- Each subscription checks workspace context from session

### SSE vs WebSocket

- Using `httpSubscriptionLink` with EventSource API (SSE)
- Simpler than WebSocket for one-way server→client communication
- Works better with Next.js serverless architecture
- Automatic reconnection on connection loss

### Event Flow

```
CallerDesk → Webhook → EventEmitter → tRPC Observable → Client Subscription → UI Update
```

### Performance Considerations

- Events are workspace-scoped to minimize memory usage
- Subscriptions auto-cleanup when component unmounts
- No polling required - true push notifications

## Future Enhancements

1. **Call Status Updates**: Show live call duration timer
2. **Multiple Calls**: Handle multiple simultaneous calls with queue
3. **Notification Sound**: Play sound on call completion
4. **Call Notes**: Quick note-taking in popup
5. **Call Actions**: Quick follow-up task creation from popup
