/* ===========================================================
   BCM SITE CONFIG
   -----------------------------------------------------------
   Fill these in once you've created your Supabase project.
   See README.md "Setting up Supabase" for step-by-step instructions.

   Until you fill these in, the site automatically falls back to
   the sample data in js/sample-data.js so it still looks alive
   while you're building it out.
   =========================================================== */

const BCM_CONFIG = {
  SUPABASE_URL: "https://hwapyqiepyokrxihtyuu.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3YXB5cWllcHlva3J4aWh0eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTg4NDMsImV4cCI6MjEwMDY3NDg0M30.NuOelwcYBkDJjHuzzbk0EyWnUfpICECCFhK4vCPGdfI",

  // Paste the "Embed" URL from Google Calendar's sharing settings here.
  GOOGLE_CALENDAR_EMBED_URL: "https://calendar.google.com/calendar/embed?src=4e765a9c352baa24f2d86e2e44756fd8cfc81fda6ee90488e9ddb23fead586ab%40group.calendar.google.com&ctz=America%2FIndiana%2FIndianapolis",

  // Optional — only needed for the "Pull from Calendar" button on the
  // Weekly Reflections admin form. Leave blank to skip that feature;
  // everything else on the site works fine without it. See README.md
  // "Setting up the 'Pull from Calendar' button" for how to get this.
  GOOGLE_CALENDAR_API_KEY: "",

  // Your standing weekly meeting — the "Insert Regular Meeting" button
  // on the Reflections admin form uses this to drop in a ready-made
  // line with the correct upcoming date already filled in. Change the
  // time/location here any time it changes, in one place.
  STANDING_MEETING: {
    weekday: 4,          // 0 = Sunday, 1 = Monday, ... 4 = Thursday, 6 = Saturday
    time: "8:00 PM",
    label: "Regular Meeting",
    location: "Loeb Playhouse"
  },

  // Home page hero slideshow. Add image files to the images/hero/
  // folder, then list their filenames here in the order you want them
  // to appear. One photo just displays statically; two or more will
  // cross-fade automatically. Add/remove photos any time by editing
  // this list — no other code changes needed.
  HERO_IMAGES: [
    "images/hero/cristian_sunset.jpg"
  ],

  // External links shown in the footer / Connect page
  LINKS: {
    groupme: "https://groupme.com/join_group/99395482/18wIAcnd",
    flocknote: "https://boilercatholics.flocknote.com/BCM/settings/group",
    instagram: "https://instagram.com/",
    email: "mailto:bcm@purdue.edu"
  }
};

function bcmIsConfigured(){
  return BCM_CONFIG.SUPABASE_URL && BCM_CONFIG.SUPABASE_URL !== "YOUR_SUPABASE_URL";
}
