/* ===========================================================
   The weekly rhythm — Rosary Walk, Bacon Boys, Large Group,
   St. Francis Perpetual Adoration Chapel, Saturday Activities.
   Edit this list any time the schedule changes; both
   calendar.html (shows the full weekly list) and index.html
   (shows just what's coming up next) pull from this same file,
   so you only ever edit it in one place.

   For events with a leaderKeyword, the page looks up whoever's
   role on the org chart (team.html, added via Admin → Org Chart)
   contains that keyword and links to them automatically.
   =========================================================== */

const REGULAR_EVENTS = [
  {
    day: "MON", time: "6:00 PM", title: "Rosary Walk",
    description: "Meet in the Gathering Space and pray a rosary together as we walk.",
    leaderKeyword: "rosary walk"
  },
  {
    day: "THU", time: "6:00 PM", title: "The Bacon Boys",
    description: "Meet in the Gathering Space, then head over to Mad Mushroom Pizza together.",
    leaderKeyword: "bacon boys"
  },
  {
    day: "THU", time: "8:00 PM", title: "Large Group",
    description: "Our main weekly gathering — faith, fun, sports, and fellowship."
  },
  {
    day: "FRI", time: "5:45 PM", title: "St. Francis Perpetual Adoration Chapel",
    description: "Leave from the Church at 5:45pm to arrive at the Chapel by 6:00pm — a quiet hour with our Lord heading into the weekend.",
    leaderKeyword: "adoration"
  },
  {
    day: "SAT", time: "Varies", title: "Saturday Activities",
    description: "First Saturday Devotion, a golf outing, or something else — check Announcements for what's on this week."
  }
];

const BCM_WEEKDAY_INDEX = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

// Parses "6:00 PM" into minutes-since-midnight. "Varies" (or anything
// unparseable) is treated as end-of-day, so it stays "today" in the
// upcoming-events sort until midnight, then rolls to next week.
function bcmParseTimeToMinutes(timeStr){
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((timeStr || '').trim());
  if (!m) return 23 * 60 + 59;
  let h = parseInt(m[1], 10) % 12;
  if (/PM/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}

// Returns the exact Date of this event's next occurrence — today if
// it's the right day and the time hasn't passed yet, otherwise the
// next week it comes around.
function bcmNextOccurrence(event, now = new Date()){
  const targetDow = BCM_WEEKDAY_INDEX[event.day];
  const targetMinutes = bcmParseTimeToMinutes(event.time);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let daysUntil = (targetDow - now.getDay() + 7) % 7;
  if (daysUntil === 0 && nowMinutes >= targetMinutes) daysUntil = 7;

  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  next.setHours(Math.floor(targetMinutes / 60), targetMinutes % 60, 0, 0);
  return next;
}

// Returns REGULAR_EVENTS sorted by soonest-next-occurrence, each with
// a `_nextDate` field attached, trimmed to `count` items.
function bcmUpcomingRegularEvents(count = 2, now = new Date()){
  return REGULAR_EVENTS
    .map(ev => ({ ...ev, _nextDate: bcmNextOccurrence(ev, now) }))
    .sort((a, b) => a._nextDate - b._nextDate)
    .slice(0, count);
}
