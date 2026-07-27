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
  GOOGLE_CALENDAR_EMBED_URL: "",

  // External links shown in the footer / Connect page
  LINKS: {
    groupme: "https://groupme.com/",
    flocknote: "https://flocknote.com/",
    instagram: "https://instagram.com/",
    email: "mailto:bcm@purdue.edu"
  }
};

function bcmIsConfigured(){
  return BCM_CONFIG.SUPABASE_URL && BCM_CONFIG.SUPABASE_URL !== "YOUR_SUPABASE_URL";
}
