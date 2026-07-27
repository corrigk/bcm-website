/* Renders a self-edit profile form into `container` for the given userId. */
async function renderProfileForm(container, userId){
  container.innerHTML = `
    <div class="eyebrow">YOUR PROFILE</div>
    <div class="panel">
      <form id="profile-form" class="stack">
        <div class="grid-2">
          <div class="field"><label>Name</label><input type="text" id="p-name" required></div>
          <div class="field"><label>Graduation Year</label><input type="number" id="p-grad-year" min="1950" max="2100"></div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>Major</label>
            <select id="p-major">
              <option value="">Select a major…</option>
              ${PURDUE_MAJORS.map(m => `<option value="${m}">${m}</option>`).join('')}
              <option value="__other__">Other / Not Listed</option>
            </select>
            <input type="text" id="p-major-other" placeholder="Type your major" style="display:none; margin-top:8px;">
          </div>
          <div class="field">
            <label>Status</label>
            <select id="p-alumni">
              <option value="false">Current Student</option>
              <option value="true">Alumnus</option>
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Company</label><input type="text" id="p-company"></div>
          <div class="field"><label>Job Title</label><input type="text" id="p-job-title"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Location</label><input type="text" id="p-location" placeholder="City, State"></div>
          <div class="field"><label>LinkedIn (optional)</label><input type="url" id="p-linkedin" placeholder="https://linkedin.com/in/..."></div>
        </div>
        <div class="field">
          <label>Short Bio (optional)</label>
          <textarea id="p-bio" placeholder="A line or two — what you're up to, how guys can reach you, etc."></textarea>
        </div>
        <div class="row">
          <button type="submit" class="btn">Save Profile</button>
          <span id="profile-saved" class="muted" style="display:none;">Saved.</span>
        </div>
      </form>
    </div>
  `;

  const styleFields = () => {
    container.querySelectorAll('input, select, textarea').forEach(el => {
      el.style.padding = '10px';
      el.style.border = '1px solid var(--paper-line)';
      el.style.background = '#fff';
      el.style.fontFamily = 'var(--f-body)';
    });
    const bio = container.querySelector('#p-bio');
    if (bio) bio.style.minHeight = '90px';
  };
  styleFields();

  const majorSelect = container.querySelector('#p-major');
  const majorOther = container.querySelector('#p-major-other');
  majorSelect.addEventListener('change', () => {
    majorOther.style.display = majorSelect.value === '__other__' ? 'block' : 'none';
  });

  try{
    const profile = await BCMData.getMyProfile(userId);
    if (profile){
      container.querySelector('#p-name').value = profile.name || '';
      container.querySelector('#p-grad-year').value = profile.grad_year || '';
      if (profile.major && PURDUE_MAJORS.includes(profile.major)){
        majorSelect.value = profile.major;
      } else if (profile.major){
        majorSelect.value = '__other__';
        majorOther.value = profile.major;
        majorOther.style.display = 'block';
      }
      container.querySelector('#p-alumni').value = profile.is_alumni ? 'true' : 'false';
      container.querySelector('#p-company').value = profile.company || '';
      container.querySelector('#p-job-title').value = profile.job_title || '';
      container.querySelector('#p-location').value = profile.location || '';
      container.querySelector('#p-linkedin').value = profile.linkedin || '';
      container.querySelector('#p-bio').value = profile.bio || '';
    }
  }catch(e){ console.error(e); }

  container.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const savedEl = container.querySelector('#profile-saved');
    savedEl.style.display = 'none';
    const majorValue = majorSelect.value === '__other__' ? majorOther.value.trim() : majorSelect.value;
    const payload = {
      name: container.querySelector('#p-name').value,
      grad_year: container.querySelector('#p-grad-year').value ? parseInt(container.querySelector('#p-grad-year').value, 10) : null,
      major: majorValue,
      is_alumni: container.querySelector('#p-alumni').value === 'true',
      company: container.querySelector('#p-company').value,
      job_title: container.querySelector('#p-job-title').value,
      location: container.querySelector('#p-location').value,
      linkedin: container.querySelector('#p-linkedin').value,
      bio: container.querySelector('#p-bio').value
    };
    try{
      await BCMData.upsertMyProfile(userId, payload);
      savedEl.style.display = 'inline';
    }catch(err){ alert(err.message); }
  });
}
