# Boiler Catholic Men — Website

A site for BCM at Purdue: home page, calendar, announcements (with a
last-minute/pinned banner), an org chart ("Who to Contact"), a Connect
page, a private members-only directory (current members + alumni, with
majors/employers/etc.), and a simple admin dashboard for managing all
of it without touching code.

No build step. It's plain HTML/CSS/JS, so you can open `index.html`
directly in a browser to preview it, and it deploys as-is to GitHub
Pages, Netlify, or any static host.

---

## 1. How it's organized

```
bcm-site/
├── index.html            Home page
├── calendar.html         Calendar (Google Calendar embed)
├── announcements.html    Announcements + last-minute banner
├── team.html             Org chart / "Who to Contact"
├── connect.html          GroupMe / Flocknote / Instagram / email links
├── admin/
│   ├── login.html        Admin (officer) login
│   └── dashboard.html    Manage announcements, org chart, and member requests
├── directory/
│   ├── signup.html       Request directory access
│   ├── login.html        Member login
│   ├── pending.html      "Waiting on approval" + edit profile early
│   ├── browse.html       Searchable member directory
│   ├── profile.html      Edit your own profile
│   └── profile-form.js   Shared profile form used by pending.html + profile.html
├── css/style.css         All styling (design tokens at the top)
├── js/
│   ├── config.js         ⚠️ Fill this in — Supabase keys, calendar link, socials
│   ├── data.js           Talks to Supabase (or falls back to sample data)
│   ├── layout.js         Shared header/nav/footer, injected on every page
│   └── sample-data.js    Demo content shown until Supabase is connected
└── sql/schema.sql        Run this in Supabase to create your tables
```

**Before Supabase is set up**, the site runs on the sample data in
`js/sample-data.js` so you can preview and deploy it immediately. The
admin dashboard will just tell you to finish setup before it lets you
save anything.

---

## 2. Setting up Supabase (the "backend")

Supabase is a free hosted database + login system — this is what lets
your officers add announcements from a web form instead of editing code.

1. Go to [supabase.com](https://supabase.com), sign up (GitHub login is
   easiest), and click **New Project**. Free tier is plenty for this.
2. Once it's created, open **SQL Editor** in the left sidebar → **New
   Query** → paste in the entire contents of `sql/schema.sql` from this
   project → **Run**. This creates the `announcements` and
   `team_members` tables with the right permissions.
3. Go to **Project Settings → API**. Copy:
   - **Project URL** → paste into `SUPABASE_URL` in `js/config.js`
   - **anon public** key → paste into `SUPABASE_ANON_KEY` in `js/config.js`
That's it for the database — the public pages will now read live data.

**Note:** the current setup lets *any* admin edit or delete *any*
announcement, team member, or member request — there's no per-role
restriction. That's intentional for a small officer team; if BCM grows
and wants finer-grained permissions later, that's a Supabase RLS policy
change.

### Creating your first admin (one-time)

Admin access (editing announcements/org chart, approving directory
requests) and directory access are both controlled by one system now —
see the next section. To become the very first admin:

1. On the live site, go to `/directory/signup.html` and create an
   account for yourself.
2. In Supabase's **SQL Editor**, run (with your real email):
   ```sql
   update member_status set approved = true, is_admin = true
   where email = 'you@purdue.edu';
   ```
3. Log in at `/admin/login.html`. From there, use the **Member
   Requests** tab to approve everyone else and promote other officers
   to admin — no more manual SQL needed after this one time.

### Optional: turn off email confirmation for signups

By default, Supabase makes new users click a confirmation link in their
email before they can log in. For a small trusted ministry this is
often unnecessary friction. To turn it off: **Authentication → Sign In
/ Providers → Email**, toggle off **"Confirm email."** If you leave it
on, that's fine too — the signup page tells people to check their email
and log in afterward.

---

## 3. The member directory (privacy note)

The directory holds real personal info — majors, employers, job
titles, LinkedIn, etc. A few things by design:

- **Nobody sees it until an admin approves them** — signing up only
  creates a pending request.
- **Each person only ever enters their own information** — there's no
  bulk-import or officer-fills-it-out-for-you flow, so nobody's details
  go up without them choosing to.
- A person can be removed from the directory at any time from the
  **Member Requests** tab ("Revoke"), which deletes their profile too.

If BCM wants an explicit "don't show my employer" style privacy toggle
per field later, that's a reasonable small addition on top of this.

**Major dropdown:** the profile form's Major field is a dropdown pulled
from `js/purdue-majors.js` — a curated (not perfectly exhaustive) list
of real Purdue majors, so entries stay consistent for filtering on the
Directory page instead of everyone typing their own variation. Anyone
whose program isn't listed can pick "Other" and type it in. To add or
remove majors, just edit the array in that file — it's plain text.

---

## 4. Setting up the Google Calendar embed

1. In Google Calendar, create (or pick) the calendar BCM will use for
   events, and make sure officers who add events have edit access to it.
2. Click the calendar's **⋮ menu → Settings and sharing**.
3. Under **Access permissions**, check **"Make available to public"**
   (otherwise the embed will be blank for visitors) — set visibility to
   "See all event details."
4. Scroll to **Integrate calendar** and copy the **Embed code**. Pull the
   `src="..."` URL out of that iframe snippet.
5. Paste that URL into `GOOGLE_CALENDAR_EMBED_URL` in `js/config.js`.

The Month/Week/Agenda buttons on the Calendar page just swap that URL's
view parameter, so no further setup is needed.

---

## 5. Filling in your links

In `js/config.js`, update the `LINKS` object with your real GroupMe join
link, Flocknote link, Instagram, and contact email. These populate the
footer (every page) and the Connect page automatically.

---

## 6. Deploying

**GitHub Pages (recommended, free):**

1. Create a new GitHub repo and push this whole folder to it.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a
   branch," branch `main`, folder `/ (root)`.
4. Your site will be live at `https://your-username.github.io/repo-name/`
   within a minute or two.

If you'd rather use Bitbucket, Bitbucket Pipelines can auto-deploy to
any static host (Netlify, Cloudflare Pages, etc.) — but plain GitHub
Pages is the least amount of setup for a static site like this one, so
it's worth getting comfortable with GitHub for this project specifically.

**Custom domain:** once deployed, both GitHub Pages and Netlify let you
point a custom domain (e.g. `bcmpurdue.org`) at the site for free —
just add a `CNAME` file or set it in the host's dashboard.

---

## 7. Day-to-day editing, without an admin account

- **Text on any page** (hero copy, "This Week" schedule, Connect page
  wording): edit the `.html` files directly — it's readable HTML with
  plain sentences in it.
- **Colors/fonts:** all defined as CSS variables at the top of
  `css/style.css` (the `:root` block) — change once, applies everywhere.
- **Nav links or footer:** edit `js/layout.js` — used on every page.

## 8. Day-to-day editing, with an admin account

Once Supabase is connected and an officer has a login:

- Go to `/admin/login.html`, sign in.
- **Announcements tab:** add a title + body, optionally check
  "Last-Minute" to pin it and show the red banner site-wide, optionally
  set an expiration date so it auto-unpins itself.
- **Org Chart tab:** add/edit/remove team members — Name, Role,
  Category (e.g. "Leadership," "Ministry Teams" — new categories just
  become new tiers on the chart automatically), Email, and an Order
  number for sorting within a tier.
- **Member Requests tab:** approve/deny people requesting directory
  access, promote an approved member to admin, or revoke access. Anyone
  can request access at `/directory/signup.html`; nothing they submit
  is visible to other members until an admin approves them.

---

## 9. Ideas for later (not built yet)

- A short "About / What We Believe" page.
- Photo galleries from retreats/events.
- Small group sign-up form feeding directly into Supabase.
- Email digest (weekly announcement summary) via a scheduled function.
- Per-field privacy toggles in the directory (e.g. hide employer, keep name/major visible).
- Email notification to admins when a new directory request comes in (Supabase Edge Function + Resend/SendGrid).

None of these are hard to add on top of this structure when you're ready.
