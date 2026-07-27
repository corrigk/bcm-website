/* Sample/demo data — shown only when Supabase isn't configured yet
   (see js/config.js). Replace by connecting Supabase; this file
   is otherwise never read. */

const BCM_SAMPLE_ANNOUNCEMENTS = [
  {
    id: "s1",
    title: "Holy Hour Moved to Wednesday This Week",
    body: "Because of the diocesan men's conference on Thursday, this week's Holy Hour will be Wednesday at 9:00 PM in the Newman Chapel instead of the usual Thursday slot. Confession available as usual.",
    pinned: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString()
  },
  {
    id: "s2",
    title: "Fall Retreat Registration Now Open",
    body: "Registration for the BCM Fall Retreat (Oct 24–26, Camp Tecumseh) is officially open. Cost is $60 and includes lodging, food, and a t-shirt. Spots are limited to 60 guys, so don't wait — link is on the Connect page. Financial aid is available; just reach out to Discipleship if cost is a barrier.",
    pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    expires_at: null
  },
  {
    id: "s3",
    title: "New Small Groups Starting This Week",
    body: "If you haven't been placed in a small group yet, come to Wednesday large group and find a Small Group Leader with an open spot — most groups meet Sunday or Tuesday nights across campus housing.",
    pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    expires_at: null
  }
];

const BCM_SAMPLE_DIRECTORY = [
  { id: "d1", name: "Jack Bowen", grad_year: 2026, major: "Mechanical Engineering", is_alumni: false, company: "Cummins (Intern)", job_title: "Engineering Intern", location: "West Lafayette, IN", linkedin: "", bio: "President this year — happy to talk about anything BCM." },
  { id: "d2", name: "Andrew Kim", grad_year: 2022, major: "Computer Science", is_alumni: true, company: "Rolls-Royce", job_title: "Software Engineer", location: "Indianapolis, IN", linkedin: "", bio: "Was Small Groups Coordinator '21-'22. Glad to mentor underclassmen." },
  { id: "d3", name: "Marcus DeYoung", grad_year: 2024, major: "Industrial Engineering", is_alumni: true, company: "Deloitte", job_title: "Consultant", location: "Chicago, IL", linkedin: "", bio: "" },
  { id: "d4", name: "Nate Ostrowski", grad_year: 2027, major: "Electrical Engineering", is_alumni: false, company: "", job_title: "", location: "West Lafayette, IN", linkedin: "", bio: "Small Groups Coordinator." }
];

const BCM_SAMPLE_MEMBER_REQUESTS = [
  { id: "p1", email: "freshman.guy@purdue.edu", name: "Tyler Novak", requested_at: new Date(Date.now() - 1000*60*60*20).toISOString(), approved: false, is_admin: false }
];

const BCM_SAMPLE_TEAM = [
  { id: "t1", name: "Fr. Michael Otieno", role: "Chaplain", category: "Leadership", email: "chaplain@bcm.org", order: 1 },
  { id: "t2", name: "Jack Bowen", role: "President", category: "Leadership", email: "president@bcm.org", order: 2 },
  { id: "t3", name: "Luke Ferraro", role: "VP of Discipleship", category: "Leadership", email: "discipleship@bcm.org", order: 3 },
  { id: "t4", name: "Sam Delgado", role: "VP of Events", category: "Leadership", email: "events@bcm.org", order: 4 },
  { id: "t5", name: "Ben Whitfield", role: "Communications Director", category: "Leadership", email: "comms@bcm.org", order: 5 },
  { id: "t6", name: "Nate Ostrowski", role: "Small Groups Coordinator", category: "Ministry Teams", email: "smallgroups@bcm.org", order: 6 },
  { id: "t7", name: "Diego Hartman", role: "Worship Lead", category: "Ministry Teams", email: "worship@bcm.org", order: 7 },
  { id: "t8", name: "Owen Kaczmarek", role: "Service & Outreach Lead", category: "Ministry Teams", email: "outreach@bcm.org", order: 8 },
  { id: "t9", name: "Elijah Ramos", role: "Freshman Rep", category: "Ministry Teams", email: "freshmen@bcm.org", order: 9 }
];
