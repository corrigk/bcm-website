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

   This never calls any AI — it's a plain, predictable data pull,
   but for a few events (Bacon Boys, the Adoration Chapel/Exalt
   Friday slot) the actual wording is close enough to identical
   every week that it's baked in below as real sentences, based on
   past Flocknotes. Large Group gets an auto-written opening
   sentence since its theme changes weekly, with room left to add
   detail by hand. Everything else falls back to a plain fact line
   (✅/❌) until it has an established pattern worth hardcoding too.

   SECTION ORDER ASSUMES A THURSDAY SEND: Today (Large Group, then
   Bacon Boys) → welcome paragraph → This Friday (Adoration/Exalt)
   → everything else as fact lines → special events → bullet list.
   If Flocknote ever goes out on a different day, this ordering
   will read oddly and should be adjusted.

   NOTE ON MATCHING: this is a same-day + close-enough-time guess,
   not a guaranteed match. If a random one-off event happens to
   land within ~90 minutes of a regular slot's usual time on the
   same weekday, it could get matched to that slot instead of
   listed separately. Always read the generated text before
   sending — this saves you the retyping, not the proofreading.
   =========================================================== */

const BCM_MATCH_WINDOW_MINUTES = 90; // how close a calendar event's time must be to a REGULAR_EVENTS time to count as "the same slot"

const BCM_WELCOME_PARAGRAPH = "Just a reminder that all men, regardless of where you are in your professional life or spiritual journey (Catholic or not) are more than welcome at BCM. Whether or not you have never been, or this is your first time in a while, you can always find a home here.";

function bcmLowerFirst(str){
  if (!str) return str;
  // Leave acronyms alone (e.g. "BCM annual..." shouldn't become "bCM annual...").
  const firstWord = (str.match(/^[A-Za-z]+/) || [''])[0];
  if (firstWord.length > 1 && firstWord === firstWord.toUpperCase()) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Canned/templated paragraphs, keyed by the REGULAR_EVENTS title
// (lowercased) they belong to. `mode` controls how bcmBuildRundownText
// uses the entry:
//   "canned" — happening()/notHappening() return a complete,
//     ready-to-send paragraph.
//   "opener" — happening()/notHappening() return just the opening
//     sentence; the rest is left for you to write, since the body
//     varies too much to template.
// A REGULAR_EVENTS entry with no matching key here just falls back
// to a plain ✅/❌ fact line.
const BCM_EVENT_TEMPLATES = {
  "the bacon boys": {
    mode: "canned",
    happening: () =>
      "Also today, continuing the Bacon Boys tradition, we will head over to Mad Mush for some super-sized pizzas. We will meet in the gathering space after the 5:30pm Daily Mass (around 6:05pm) and head down from there. You are more than welcome to just meet us at the restaurant too!",
    notHappening: () =>
      "Bacon Boys is NOT happening this week. The BCM leadership team is indeed saddened by this, but we will pick back up as soon as we can!"
  },
  "large group": {
    mode: "opener",
    happening: (ev) => {
      const loc = ev.location ? ` in ${ev.location}` : '';
      const desc = ev.description ? ` for ${bcmLowerFirst(ev.description)}` : '';
      return `Today at ${ev.timeLabel}, BCM will be meeting${loc}${desc}. [Add more detail about what to expect.]`;
    },
    notHappening: (ctx) => {
      const alt = ctx.specialEvents[0];
      if (alt){
        const loc = alt.location ? ` in ${alt.location}` : '';
        const desc = alt.description ? ` for ${bcmLowerFirst(alt.description)}` : '';
        return `Today at ${alt.timeLabel || alt.dateLabel}, BCM will NOT be meeting, however ${alt.title} will be happening${loc}${desc} instead.`;
      }
      return 'Today, BCM will NOT be meeting this week. We are incredibly sad about this, but we will pick back up as soon as we can!';
    }
  },
  "st. francis perpetual adoration chapel": {
    mode: "canned",
    happening: (ev) =>
      `This Friday, WE WILL BE going to the St. Francis Perpetual Adoration Chapel. We will leave from the Church at ${ev.timeLabel || '5:45pm'} to arrive at the Chapel by 6:00pm. Feel free to meet us there and I will be happy to let you in! This is a wonderful chance to soak in the beautiful adoration chapel, while in the presence of our Lord especially going into the weekend.`,
    notHappening: (ctx) => {
      const exalt = ctx.specialEvents.find(e => /exalt/i.test(e.title));
      if (exalt){
        return `This Friday, we will NOT be going to the St. Francis Perpetual Adoration Chapel because of Exalt. Exalt is where we as a Boiler Catholic community come together in the Church at ${exalt.timeLabel || '8:00pm'} for both silent Adoration and praise and worship. This is a beautiful opportunity to recenter your mind, body, and soul nearing the end of the week and the beginning of the weekend.`;
      }
      return "This Friday, we will NOT be going to the St. Francis Perpetual Adoration Chapel — check Announcements for what's happening instead.";
    }
  }
};

// The display order the narrative paragraphs are assembled in —
// keys into BCM_EVENT_TEMPLATES, matched against REGULAR_EVENTS by
// title (case-insensitive). Anything in REGULAR_EVENTS not listed
// here falls back to a fact line instead, in its normal list order.
const BCM_NARRATIVE_ORDER = ["large group", "the bacon boys", "st. francis perpetual adoration chapel"];

// Some slots must NOT fall back to a pure time-match: your Easter
// example showed that when Large Group is swapped for something
// else entirely (BCE instead of BCM), you write it as an explicit
// "NOT meeting, however X instead" — not as if the substitute WAS
// Large Group. So for these, an unmatched name means "not happening"
// even if something else occupies the same day/time. Other slots
// (Bacon Boys, Adoration Chapel) keep the same convention since a
// same-slot event with no matching name is more likely a genuine
// swap than a rename.
const BCM_REQUIRE_NAME_MATCH = new Set(["large group", "the bacon boys", "st. francis perpetual adoration chapel"]);

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
// only for slots NOT in BCM_REQUIRE_NAME_MATCH above.
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
  if (!byName.length && BCM_REQUIRE_NAME_MATCH.has(nameNeedle)) return -1;
  const pool = byName.length ? byName : candidates;
  pool.sort((a, b) => a.score - b.score);
  return pool[0].i;
}

// Pure text-builder — takes already-fetched events arrays (see
// bcmFetchUpcomingEventsRaw / bcmFetchRecentEventsRaw) so it can be
// unit-tested without a network call. bcmGenerateFlocknoteRundown()
// below is the version that actually fetches.
function bcmBuildRundownText(events, pastEvents = []){
  const usedIndexes = new Set();

  // Match every REGULAR_EVENTS slot against this week's events first,
  // so narrative paragraphs and fact lines both know what's real vs.
  // what's a stand-in, and so "special events" below only lists what's
  // genuinely left over.
  const matches = REGULAR_EVENTS.map(reg => {
    const idx = bcmFindRegularEventMatch(reg, events, usedIndexes);
    if (idx !== -1) usedIndexes.add(idx);
    return { reg, ev: idx === -1 ? null : events[idx] };
  });

  const specialEvents = events.filter((ev, i) => !usedIndexes.has(i));
  const ctx = { specialEvents };

  const narrativeKeys = new Set(BCM_NARRATIVE_ORDER);
  const narrativeParagraphs = BCM_NARRATIVE_ORDER.map(key => {
    const m = matches.find(x => x.reg.title.toLowerCase() === key);
    const tpl = m && BCM_EVENT_TEMPLATES[key];
    if (!m || !tpl) return null;
    return m.ev ? tpl.happening(m.ev) : tpl.notHappening(ctx);
  }).filter(Boolean);

  const factLines = matches
    .filter(m => !narrativeKeys.has(m.reg.title.toLowerCase()))
    .map(({ reg, ev }) => {
      if (!ev) return `❌ ${reg.title} — NOT happening this week`;
      const desc = ev.description || reg.description;
      // Avoid "Rosary Walk: Rosary Walk" when the calendar title
      // already contains the regular event's name.
      const alreadyTagged = ev.title.toLowerCase().includes(reg.title.toLowerCase());
      const titlePart = alreadyTagged ? ev.title : `${reg.title}: ${ev.title}`;
      const timePart = ev.isAllDay ? reg.day : `${reg.day} ${ev.timeLabel || reg.time}`;
      const locPart = ev.location ? ` — ${ev.location}` : '';
      return `✅ ${titlePart} — ${timePart}${locPart} — ${desc}`;
    });

  const specialLines = specialEvents.map(ev => {
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

  // "Last week we..." — reuses the same matcher against last week's
  // events, anchored on the Large Group slot (BCM's main gathering),
  // since that's the event these callbacks have referenced so far.
  const lastWeekLine = (() => {
    const lgReg = REGULAR_EVENTS.find(r => r.title.toLowerCase() === 'large group');
    if (!lgReg) return null;
    const idx = bcmFindRegularEventMatch(lgReg, pastEvents, new Set());
    if (idx === -1) return null;
    const ev = pastEvents[idx];
    const desc = ev.description ? bcmLowerFirst(ev.description) : bcmLowerFirst(ev.title);
    return `[Last week we came together for ${desc} — edit or remove this line freely.]`;
  })();

  const parts = [];
  if (lastWeekLine){ parts.push(lastWeekLine); parts.push(''); }
  parts.push("[Write your intro here — remember to mention that everyone is welcome at BCM, no matter where they're at in their professional life or spiritual journey!]");
  parts.push('');
  narrativeParagraphs.forEach(p => { parts.push(p); parts.push(''); });
  parts.push(BCM_WELCOME_PARAGRAPH);
  if (factLines.length){
    parts.push('');
    parts.push('OTHER REGULAR EVENTS THIS WEEK:');
    parts.push(factLines.join('\n'));
  }
  if (specialLines.length){
    parts.push('');
    parts.push('SPECIAL EVENTS THIS WEEK:');
    parts.push(specialLines.join('\n'));
  }
  parts.push('');
  parts.push('Weekly Events:');
  parts.push(bulletLines.length ? bulletLines.join('\n') : 'No events found on the calendar this week.');

  return parts.join('\n');
}

// Fetches last week's and this week's events from Google Calendar,
// then builds the rundown text. This is what the admin dashboard
// button calls.
async function bcmGenerateFlocknoteRundown(){
  const [pastEvents, events] = await Promise.all([
    bcmFetchRecentEventsRaw(7),
    bcmFetchUpcomingEventsRaw(7)
  ]);
  return bcmBuildRundownText(events, pastEvents);
}
