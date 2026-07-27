/* ===========================================================
   BCM DATA LAYER
   Wraps Supabase so every page just calls BCMData.getAnnouncements()
   etc. and doesn't care whether Supabase is wired up yet.
   Requires: config.js, sample-data.js, and (if configured) the
   Supabase JS CDN script loaded before this file.
   =========================================================== */

const BCMData = (() => {
  let client = null;
  if (bcmIsConfigured() && window.supabase) {
    client = window.supabase.createClient(BCM_CONFIG.SUPABASE_URL, BCM_CONFIG.SUPABASE_ANON_KEY);
  }

  function isLive(){ return !!client; }

  async function getAnnouncements(){
    if (!client) return [...BCM_SAMPLE_ANNOUNCEMENTS];
    const { data, error } = await client
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) { console.error('getAnnouncements', error); return []; }
    return data;
  }

  async function getTeam(){
    if (!client) return [...BCM_SAMPLE_TEAM];
    const { data, error } = await client
      .from('team_members')
      .select('*')
      .order('category', { ascending: true })
      .order('order', { ascending: true });
    if (error) { console.error('getTeam', error); return []; }
    return data;
  }

  // ---- admin: announcements ----
  async function createAnnouncement(payload){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { data, error } = await client.from('announcements').insert(payload).select();
    if (error) throw error;
    return data[0];
  }
  async function updateAnnouncement(id, payload){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { data, error } = await client.from('announcements').update(payload).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
  async function deleteAnnouncement(id){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { error } = await client.from('announcements').delete().eq('id', id);
    if (error) throw error;
  }

  // ---- admin: team ----
  async function createTeamMember(payload){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { data, error } = await client.from('team_members').insert(payload).select();
    if (error) throw error;
    return data[0];
  }
  async function updateTeamMember(id, payload){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { data, error } = await client.from('team_members').update(payload).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
  async function deleteTeamMember(id){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { error } = await client.from('team_members').delete().eq('id', id);
    if (error) throw error;
  }

  // ---- auth ----
  async function signUp(email, password, fullName){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
  }
  async function signIn(email, password){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut(){
    if (!client) return;
    await client.auth.signOut();
  }
  async function getSession(){
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session;
  }

  // ---- member status / directory ----

  // Called right after login. Creates the member_status (+ empty
  // profile) rows the first time this user is ever seen — a lazy
  // "finish signup" step that works whether or not email
  // confirmation is turned on in Supabase.
  async function ensureMemberRow(session){
    if (!client || !session) return;
    const { data: existing } = await client
      .from('member_status').select('id').eq('id', session.user.id).maybeSingle();
    if (existing) return;

    const fullName = session.user.user_metadata?.full_name || session.user.email;
    const { error: statusErr } = await client.from('member_status').insert({
      id: session.user.id, email: session.user.email, approved: false, is_admin: false
    });
    if (statusErr) { console.error('ensureMemberRow status', statusErr); return; }

    const { error: profileErr } = await client.from('member_profiles').insert({
      id: session.user.id, name: fullName
    });
    if (profileErr) console.error('ensureMemberRow profile', profileErr);
  }

  async function getMyStatus(userId){
    if (!client) return null;
    const { data, error } = await client.from('member_status').select('*').eq('id', userId).maybeSingle();
    if (error) { console.error('getMyStatus', error); return null; }
    return data;
  }

  async function getMyProfile(userId){
    if (!client) return null;
    const { data, error } = await client.from('member_profiles').select('*').eq('id', userId).maybeSingle();
    if (error) { console.error('getMyProfile', error); return null; }
    return data;
  }

  async function upsertMyProfile(userId, payload){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { data, error } = await client
      .from('member_profiles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select();
    if (error) throw error;
    return data[0];
  }

  async function getDirectory(){
    if (!client) return [...BCM_SAMPLE_DIRECTORY];
    const { data, error } = await client
      .from('member_profiles')
      .select('*, member_status!inner(approved)')
      .eq('member_status.approved', true)
      .order('name');
    if (error) { console.error('getDirectory', error); return []; }
    return data;
  }

  // ---- admin: member requests ----
  async function listPendingRequests(){
    if (!client) return [...BCM_SAMPLE_MEMBER_REQUESTS];
    const { data, error } = await client
      .from('member_status')
      .select('*, member_profiles(name)')
      .eq('approved', false)
      .order('requested_at', { ascending: true });
    if (error) { console.error('listPendingRequests', error); return []; }
    return data.map(r => ({ ...r, name: r.member_profiles?.name || r.email }));
  }

  async function listApprovedMembers(){
    if (!client) return [];
    const { data, error } = await client
      .from('member_status')
      .select('*, member_profiles(name)')
      .eq('approved', true)
      .order('email');
    if (error) { console.error('listApprovedMembers', error); return []; }
    return data.map(r => ({ ...r, name: r.member_profiles?.name || r.email }));
  }

  async function approveMember(id){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { error } = await client.from('member_status').update({ approved: true }).eq('id', id);
    if (error) throw error;
  }
  async function denyMember(id){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { error } = await client.from('member_status').delete().eq('id', id);
    if (error) throw error;
  }
  async function setAdmin(id, isAdmin){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { error } = await client.from('member_status').update({ is_admin: isAdmin }).eq('id', id);
    if (error) throw error;
  }
  async function removeMember(id){
    if (!client) throw new Error('Connect Supabase first (see README).');
    const { error } = await client.from('member_status').delete().eq('id', id);
    if (error) throw error;
  }

  return {
    isLive, getAnnouncements, getTeam,
    createAnnouncement, updateAnnouncement, deleteAnnouncement,
    createTeamMember, updateTeamMember, deleteTeamMember,
    signUp, signIn, signOut, getSession,
    ensureMemberRow, getMyStatus, getMyProfile, upsertMyProfile, getDirectory,
    listPendingRequests, listApprovedMembers, approveMember, denyMember, setAdmin, removeMember
  };
})();
