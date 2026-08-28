/* ===========================================================
   Builds a "Weekly Rundown" skeleton for the Flocknote/newsletter,
   for the Admin → Flocknote tab's "Generate This Week's Rundown"
   button.

   For each REGULAR_EVENTS slot (see js/regular-events.js), this
   looks for a matching calendar event in the next 7 days by day
   of week + roughly matching time — NOT by title, since Large
   Group is titled something different most weeks (e.g. "Large
   Group: Trivia Night"). When a match is found, the real calendar
   title + description are used, so the weekly theme comes through.
   When no match is found, that slot is marked NOT happening.

   Any calendar event that doesn't match a REGULAR_EVENTS slot is
   listed separately as a one-off/special event (BCE Murder
   Mystery, Adoration Chapel trip, etc.), with its description
   pulled straight from the calendar.

   This never calls any AI — it's a plain, predictable data pull.
   You still write the narrative intro yourself; a placeholder
   line is left at the top as a reminder of what to cover.

   NOTE ON MATCHING: this is a same-day + close-enough-time guess,
   not a guaranteed match. If a random one-off event happens to
   land within ~90 minutes of a regular slot's usual time on the
   same weekday, it could get matched to that slot instead of
   listed separately. Always read the generated text before
   sending — this saves you the retyping, not the proofreading.
   =========================================================== */

const BCM_MATCH_WINDOW_MINUTES = 90; // how close a calendar event's time must be to a REGULAR_EVENTS time to count as "the same slot"

// Finds the best unclaimed calendar event matching a REGULAR_EVENTS
// slot's day of week (and, unless the slot's time is "Varies", its
// time within BCM_MATCH_WINDOW_MINUTES). Returns its index in
// `events`, or -1 if nothing matches.
//
// Two passes, because time-proximity alone isn't reliable: a
// same-day special event can land closer to the usual time than
// the real (slightly shifted) recurring event does. Pass 1 only
// considers candidates whose title still contains the regular
// event's name (e.g. "Large Group: Trivia Night" contains "Large
// Group") — this is why it's worth keeping that word in the title
// even on weeks it's renamed. Pass 2 falls back to pure nearest-time
// only if nothing matched by name.
function bcmFindRegularEventMatch(regularEvent, events, usedIndexes){
  const targetDow = BCM_WEEKDAY_INDEX[regularEvent.day];
  const targetMinutes = bcmParseTimeToMinutes(regularEvent.time);
  const isVariesTime = /varies/i.test(regularEvent.time);
  const nameNeedle = regularEvent.title.toLowerCase();

  const candidates = [];
  events.forEach((ev, i) => {
    if (usedIndexes.has(i)) return;
    if (ev.dayOfWeek !== targetDow) return;
    if (isVariesTime){
      candidates.push({ i, ev, score: ev.timeMinutes == null ? 9999 : ev.timeMinutes });
      return;
    }
    if (ev.timeMinutes == null) return; // can't time-match an all-day event to a specific time slot
    const diff = Math.abs(ev.timeMinutes - targetMinutes);
    if (diff <= BCM_MATCH_WINDOW_MINUTES) candidates.push({ i, ev, score: diff });
  });

  if (!candidates.length) return -1;

  const byName = candidates.filter(c => c.ev.title.toLowerCase().includes(nameNeedle));
  const pool = byName.length ? byName : candidates;
  pool.sort((a, b) => a.score - b.score);
  return pool[0].i;
}

// Pure text-builder — takes an already-fetched events array (see
// bcmFetchUpcomingEventsRaw) so it can be unit-tested without a
// network call. bcmGenerateFlocknoteRundown() below is the version
// that actually fetches.
function bcmBuildRundownText(events){
  const usedIndexes = new Set();

  const recurringLines = REGULAR_EVENTS.map(reg => {
    const idx = bcmFindRegularEventMatch(reg, events, usedIndexes);
    if (idx === -1){
      return `❌ ${reg.title} — NOT happening this week`;
    }
    usedIndexes.add(idx);
    const ev = events[idx];
    const desc = ev.description || reg.description;
    // Avoid "Large Group: Large Group: Trivia Night" when the
    // calendar title already contains the regular event's name.
    const alreadyTagged = ev.title.toLowerCase().includes(reg.title.toLowerCase());
    const titlePart = alreadyTagged ? ev.title : `${reg.title}: ${ev.title}`;
    const timePart = ev.isAllDay ? reg.day : `${reg.day} ${ev.timeLabel || reg.time}`;
    const locPart = ev.location ? ` — ${ev.location}` : '';
    return `✅ ${titlePart} — ${timePart}${locPart} — ${desc}`;
  });

  const specialLines = events
    .map((ev, i) => ({ ev, i }))
    .filter(({ i }) => !usedIndexes.has(i))
    .map(({ ev }) => {
      const timePart = ev.isAllDay ? ev.dateLabel : `${ev.dateLabel} ${ev.timeLabel}`;
      const locPart = ev.location ? ` — ${ev.location}` : '';
      const descPart = ev.description ? ` — ${ev.description}` : '';
      return `• ${ev.title} — ${timePart}${locPart}${descPart}`;
    });

  const bulletLines = [...events]
    .sort((a, b) => a.start - b.start)
    .map(ev => {
      const timePart = ev.isAllDay ? '' : ` @ ${ev.timeLabel}`;
      const locPart = ev.location ? ` - ${ev.location}` : '';
      return `* ${ev.dateLabel} - ${ev.title}${timePart}${locPart}`;
    });

  const parts = [];
  parts.push("[Write your intro here — remember to mention that everyone is welcome at BCM, no matter where they're at in their professional life or spiritual journey!]");
  parts.push('');
  parts.push('RECURRING EVENTS THIS WEEK:');
  parts.push(recurringLines.join('\n'));
  if (specialLines.length){
    parts.push('');
    parts.push('SPECIAL EVENTS THIS WEEK:');
    parts.push(specialLines.join('\n'));
  }
  parts.push('');
  parts.push('WEEKLY EVENTS (paste into Flocknote):');
  parts.push(bulletLines.length ? bulletLines.join('\n') : 'No events found on the calendar this week.');

  return parts.join('\n');
}

// Fetches the next 7 days from Google Calendar, then builds the
// rundown text. This is what the admin dashboard button calls.
async function bcmGenerateFlocknoteRundown(){
  const events = await bcmFetchUpcomingEventsRaw(7);
  return bcmBuildRundownText(events);
}
