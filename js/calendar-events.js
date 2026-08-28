/* ===========================================================
   Fetches events from the same public Google Calendar used on
   calendar.html, and formats them into plain text for the
   Weekly Reflection admin form's "Pull from Calendar" button.

   Read-only, uses an API key (no login/OAuth needed) since the
   calendar is already shared publicly for the embed to work.
   =========================================================== */

function bcmGetCalendarId(){
  if (!BCM_CONFIG.GOOGLE_CALENDAR_EMBED_URL) return null;
  try{
    const url = new URL(BCM_CONFIG.GOOGLE_CALENDAR_EMBED_URL);
    return url.searchParams.get('src');
  }catch(e){ return null; }
}

function bcmCalendarConfigured(){
  return !!(BCM_CONFIG.GOOGLE_CALENDAR_API_KEY && bcmGetCalendarId());
}

// Fetches events in [now - daysBack, now + daysForward] and returns
// them as a formatted text block, split into "Recent" and "Coming Up".
async function bcmFetchCalendarEventsText(daysBack = 7, daysForward = 14){
  if (!bcmCalendarConfigured()){
    throw new Error("Google Calendar API isn't set up yet — see README.md \"Setting up the 'Pull from Calendar' button\".");
  }
  const calendarId = bcmGetCalendarId();
  const now = new Date();
  const timeMin = new Date(now.getTime() - daysBack * 86400000).toISOString();
  const timeMax = new Date(now.getTime() + daysForward * 86400000).toISOString();

  const params = new URLSearchParams({
    key: BCM_CONFIG.GOOGLE_CALENDAR_API_KEY,
    timeMin, timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50'
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  if (!res.ok){
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Calendar API error (${res.status})`);
  }
  const data = await res.json();
  const events = data.items || [];

  const fmt = (ev) => {
    const start = ev.start?.dateTime || ev.start?.date;
    const isAllDay = !ev.start?.dateTime;
    const d = new Date(start);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = isAllDay ? '' : `, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const loc = ev.location ? ` @ ${ev.location}` : '';
    return `${dateStr}${timeStr} — ${ev.summary || 'Untitled event'}${loc}`;
  };

  const past = events.filter(e => new Date(e.start?.dateTime || e.start?.date) < now).map(fmt);
  const upcoming = events.filter(e => new Date(e.start?.dateTime || e.start?.date) >= now).map(fmt);

  let text = '';
  if (past.length) text += `RECENT:\n${past.join('\n')}\n\n`;
  if (upcoming.length) text += `COMING UP:\n${upcoming.join('\n')}`;
  return text.trim() || 'No events found in this date range — add them manually below.';
}

// Shared fetch+parse helper for the two "raw events" functions below.
// Not exported/used directly outside this file.
async function bcmFetchRawEventsBetween(timeMin, timeMax){
  if (!bcmCalendarConfigured()){
    throw new Error("Google Calendar API isn't set up yet — see README.md \"Setting up the 'Pull from Calendar' button\".");
  }
  const calendarId = bcmGetCalendarId();
  const params = new URLSearchParams({
    key: BCM_CONFIG.GOOGLE_CALENDAR_API_KEY,
    timeMin, timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50'
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  if (!res.ok){
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Calendar API error (${res.status})`);
  }
  const data = await res.json();
  return (data.items || []).map(ev => {
    const startRaw = ev.start?.dateTime || ev.start?.date;
    const isAllDay = !ev.start?.dateTime;
    const start = new Date(startRaw);
    return {
      title: (ev.summary || 'Untitled event').trim(),
      description: (ev.description || '').trim(),
      location: (ev.location || '').trim(),
      start,
      isAllDay,
      dayOfWeek: start.getDay(), // 0 = Sunday ... 6 = Saturday, matches BCM_WEEKDAY_INDEX
      timeMinutes: isAllDay ? null : start.getHours() * 60 + start.getMinutes(),
      dateLabel: start.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
      timeLabel: isAllDay ? '' : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  });
}

// Fetches events for the next `daysForward` days and returns them as
// raw objects (title, description, location, timing) rather than
// formatted text — used by the Flocknote Rundown generator
// (js/flocknote-generator.js), which needs the real description text
// and needs to compare event times against REGULAR_EVENTS.
async function bcmFetchUpcomingEventsRaw(daysForward = 7){
  const now = new Date();
  const timeMax = new Date(now.getTime() + daysForward * 86400000).toISOString();
  return bcmFetchRawEventsBetween(now.toISOString(), timeMax);
}

// Fetches events from the past `daysBack` days up to now, same raw
// shape as bcmFetchUpcomingEventsRaw. Used by the Flocknote Rundown
// generator to build the "Last week we..." opening line.
async function bcmFetchRecentEventsRaw(daysBack = 7){
  const now = new Date();
  const timeMin = new Date(now.getTime() - daysBack * 86400000).toISOString();
  return bcmFetchRawEventsBetween(timeMin, now.toISOString());
}

// Formats the standing weekly meeting (see BCM_CONFIG.STANDING_MEETING)
// as one line, using the nearest upcoming occurrence of its weekday —
// today if it's that day and not yet passed, otherwise next week.
function bcmStandingMeetingText(){
  const m = BCM_CONFIG.STANDING_MEETING;
  if (!m) return '';
  const now = new Date();
  const daysUntil = (m.weekday - now.getDay() + 7) % 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  const dateStr = next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const loc = m.location ? ` @ ${m.location}` : '';
  return `${dateStr}, ${m.time} — ${m.label}${loc}`;
}
