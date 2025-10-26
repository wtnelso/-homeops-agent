# Event Scheduling Tool Testing Guide

## Overview
Testing the EventSchedulingTool with vague timeframe detection, Google Calendar integration, and conversation continuity.

## Fixed Issues
- ✅ **Vague Timeframe Detection**: "next week" now returns proper Monday-Friday range instead of 1-hour window
- ✅ **Calendar Integration**: Real availability checking with appropriate business hours
- ✅ **Conversation Continuity**: Updates existing pending events instead of creating duplicates
- ✅ **Time Suggestions**: No more inappropriate "Sunday 9 AM" suggestions

## Test Results

### Test 1: "schedule dinner with mom this weekend" ✅ FIXED
**Status**: Now working correctly with improved styling
- **Backend**: Fixed vague timeframe detection (weekend vs weekday)
- **UI**: Fixed data path (`data.data.event_scheduling`)
- **Styling**: Clean horizontal layout with time suggestion buttons
- **Expected**: Saturday/Sunday suggestions with compact status

### Test 2: Follow-up Time Selection ✅
**Status**: Working - updates existing event
- **Conversation Continuity**: Same event ID maintained
- **Database**: Updates pending_calendar_events record
- **UI**: Shows selected time, reduced missing info

### Current Issue: UI State ⚠️
- May still show old "Need email address" state
- **Solution**: Test complete flow from scratch in new conversation

## Test Scenarios

### 1. Basic Vague Scheduling (should trigger time suggestions)
```
schedule lunch with Sarah next week
schedule dinner with mom this weekend  ✅ TESTED
set up a meeting with John sometime next week
plan coffee with Alex this weekend
```

### 2. Follow-up Time Selection (should update existing event)
After getting suggestions from above, try:
```
Saturday at 6 PM sounds good
Sunday at 7 PM works for me
How about Saturday at 5:30 PM?
Friday at 11 AM is perfect
```

### 3. Specific Time From Start (should be ready except for email)
```
schedule lunch with Sarah on Friday at 12:30 PM
book dinner with mom on Saturday at 7 PM
set up a meeting with John on Tuesday at 2 PM
```

### 4. Email Follow-up (should make it ready for calendar)
After providing specific time:
```
mom's email is mom@family.com
Sarah's email is sarah@example.com
john.smith@company.com is his email
```

### 5. Edge Cases to Test
```
schedule lunch next Tuesday (specific day in vague week)
meet with Sarah when she's available (very vague)
dinner this Friday at 7 (mix of specific and vague)
```

## Expected UI Behavior

### EventSchedulingTemplate Display
- **Title**: Event name with attendee (e.g., "Dinner with Mom")
- **Time Info**: Shows "Time to be determined" for vague requests
- **Status**: "Waiting for additional information" with missing info list
- **Time Suggestions**: Should appear for vague timeframes (currently missing from UI)
- **Ready State**: Green checkmark when all info complete

### Missing Features Observed
1. **Time Suggestions Not Displayed**: UI shows "waiting for additional information" but doesn't show the actual time suggestions returned by the backend
2. **Missing Info Details**: Should show what specifically is needed (time, email, etc.)

## Backend Data Flow

### Successful Flow Example
```json
{
  "event_id": "31d7ed52-4400-4435-af18-287faf5bc1fa",
  "timeframe": "this weekend",
  "time_type": "vague",
  "start_time": null,
  "end_time": null,
  "time_suggestions": [
    {"day": "Saturday", "times": ["10:00 AM", "2:00 PM"]},
    {"day": "Sunday", "times": ["11:00 AM", "3:00 PM"]}
  ],
  "missing_info": ["specific_time"]
}
```

## Next Steps for Testing
1. ✅ Test basic vague scheduling
2. 🔄 Check if time suggestions appear in UI
3. ⏳ Test follow-up time selection
4. ⏳ Test email collection flow
5. ⏳ Verify no duplicate events created
6. ⏳ Test transition to "ready for calendar" state

## Known Issues
- **UI**: Time suggestions from backend not displayed in EventSchedulingTemplate
- **Time Selection**: Need to test if follow-up time selection updates existing event

## Technical Details

### Temporal Parsing Service Changes
- Added `parseVagueTimeframe()` method
- "next week" → Monday 9 AM to Friday 5 PM
- "this weekend" → Saturday 10 AM to Sunday 8 PM
- "next weekend" → Next Saturday 10 AM to Sunday 8 PM

### EventSchedulingTool Changes
- Added `createOrUpdatePendingEvent()` method
- Added `findRecentPendingEvent()` method
- Checks for existing events within 1 hour window
- Updates instead of creating duplicates

### Database Schema
- `pending_calendar_events` table tracks scheduling state
- `time_type`: 'vague' or 'specific'
- `start_time`/`end_time`: null for vague, populated for specific
- `status`: 'pending' during scheduling process