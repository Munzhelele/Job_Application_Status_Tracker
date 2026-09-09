/*
  APPLICATION TRACKER - UI ONLY, no seeded data.

  `apps` and `teamUsers` start empty. Everything here is in-memory
  for demo purposes; wire your own persistence (SQL backend) into
  the functions marked TODO.
*/

const STAGES = ["Applied","Screening","Interview","Offer"];
const TERMINAL = ["Rejected","Withdrawn"];

let apps = [];          // job applications- populated by the user, not seeded
let teamUsers = [];     // people invited via the Team & roles tab — starts empty
let selectedId = null;
let activeFilter = "All";
let searchTerm = "";

function uid(prefix){
  return prefix + '-' + Math.random().toString(36).slice(2,10);
}

// Called by auth.js right after a successful login/register.
function onAppEntered(){
  selectedId = null;
  activeFilter = "All";
  searchTerm = "";
  document.getElementById('searchInput').value = "";
  render();
}

// ================= RENDERING: APPLICATIONS =================
function render(){
  renderStats();
  renderFilters();
  renderList();
  renderDetail();
}

function renderStats(){
  const total = apps.length;
  const counts = {};
  apps.forEach(a => counts[a.status] = (counts[a.status]||0) + 1);
  const el = document.getElementById('stats');
  el.innerHTML = `
    <span><b>${total}</b> tracked</span>
    <span><b>${counts['Interview']||0}</b> interviewing</span>
    <span><b>${counts['Offer']||0}</b> offers</span>
    <span><b>${counts['Rejected']||0}</b> rejected</span>
  `;
}

function renderFilters(){
  const options = ["All","Applied","Screening","Interview","Offer","Rejected","Withdrawn"];
  const el = document.getElementById('filters');
  el.innerHTML = options.map(o =>
    `<button class="chip ${o===activeFilter?'active':''}" data-filter="${o}">${o}</button>`
  ).join('');
  el.querySelectorAll('.chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeFilter = btn.dataset.filter;
      render();
    });
  });
}

function filteredApps(){
  return apps.filter(a=>{
    const matchesFilter = activeFilter === "All" || a.status === activeFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || a.company.toLowerCase().includes(term) || a.role.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });
}

function renderList(){
  const list = filteredApps();
  const el = document.getElementById('jobList');

  if(apps.length === 0){
    el.innerHTML = `<div class="empty-side">Nothing tracked yet. Use "+ Add application" to start.</div>`;
    return;
  }
  if(list.length === 0){
    el.innerHTML = `<div class="empty-side">No applications match this filter.</div>`;
    return;
  }

  el.innerHTML = list.map(a => `
    <li data-id="${a.id}" class="${a.id===selectedId?'selected':''}">
      <p class="company">${escapeHtml(a.company)}</p>
      <p class="role">${escapeHtml(a.role)}</p>
      <div class="stat-line"><span class="status-dot ${a.status}"></span>${a.status}</div>
    </li>
  `).join('');

  el.querySelectorAll('li').forEach(li=>{
    li.addEventListener('click', ()=>{
      selectedId = li.dataset.id;
      render();
    });
  });
}

function renderDetail(){
  const el = document.getElementById('detail');
  const app = apps.find(a=>a.id===selectedId);

  if(!app){
    el.innerHTML = `
      <div class="detail-empty">
        <p class="serif empty-title">${apps.length === 0 ? 'No applications yet' : 'Nothing selected'}</p>
        <p>${apps.length === 0
          ? "Add the first job you've applied to, and it'll show up here."
          : "Pick an application on the left to see its details."}</p>
      </div>`;
    return;
  }

  const isTerminal = TERMINAL.includes(app.status);

  el.innerHTML = `
    <div class="detail-head">
      <div>
        <h2>${escapeHtml(app.role)}</h2>
        <div class="meta">${escapeHtml(app.company)} · ${escapeHtml(app.location||'—')} · applied ${formatDate(app.dateApplied)}</div>
      </div>
      <button class="icon-btn" id="deleteBtn">Remove</button>
    </div>

    <section class="block">
      <h3>Stage</h3>
      ${isTerminal ? `
        <div class="terminal-banner ${app.status}">${app.status === 'Rejected' ? 'This application was not successful.' : 'You withdrew this application.'}</div>
        <div class="stage-actions">
          <button class="reopen" id="reopenBtn">Reopen at Applied</button>
        </div>
      ` : `
        <div class="stage-track" id="stageTrack"></div>
        <div class="stage-actions">
          <button class="reject" id="rejectBtn">Mark rejected</button>
          <button class="withdraw" id="withdrawBtn">Mark withdrawn</button>
        </div>
      `}
    </section>

    <section class="block">
      <h3>Original posting</h3>
      ${app.url ? `
        <div class="posting-card">
          <div>
            <p class="p-title">${escapeHtml(app.role)}</p>
            <p class="p-url">${escapeHtml(app.url)}</p>
          </div>
          <a class="view-link" href="${escapeAttr(app.url)}" target="_blank" rel="noopener">View job post ↗</a>
        </div>
      ` : `<p class="no-posting">No link saved for this posting.</p>`}
    </section>

    <section class="block">
      <h3>Skills listed</h3>
      ${app.skills && app.skills.length ? `
        <div class="skills">${app.skills.map(s=>`<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}</div>
      ` : `<p class="no-skills">No skills recorded for this posting.</p>`}
    </section>

    <section class="block">
      <h3>My notes</h3>
      <p class="notes-hint">${isTerminal
        ? "What do you think went wrong, and what would you change for next time? Be specific — cover letter, interview answers, skill gaps, timing."
        : "Anything worth remembering about this application — recruiter names, prep material, questions asked."}</p>
      <textarea id="notesArea" placeholder="Write your notes here…">${escapeHtml(app.notes||'')}</textarea>
    </section>
  `;

  if(!isTerminal){
    renderStageTrack(app);
    document.getElementById('rejectBtn').addEventListener('click', ()=> setStatus(app.id, 'Rejected'));
    document.getElementById('withdrawBtn').addEventListener('click', ()=> setStatus(app.id, 'Withdrawn'));
  } else {
    document.getElementById('reopenBtn').addEventListener('click', ()=> setStatus(app.id, 'Applied'));
  }

  document.getElementById('deleteBtn').addEventListener('click', ()=>{
    apps = apps.filter(a=>a.id!==app.id);
    if(selectedId === app.id) selectedId = null;
    render();
  });

  const notesArea = document.getElementById('notesArea');
  notesArea.addEventListener('input', ()=>{
    app.notes = notesArea.value;
    // TODO: persist note to your backend here (e.g. debounce + PATCH /applications/:id)
  });
}

function renderStageTrack(app){
  const track = document.getElementById('stageTrack');
  const currentIndex = STAGES.indexOf(app.status);
  track.innerHTML = STAGES.map((stage, i)=>{
    const state = i < currentIndex ? 'done' : (i === currentIndex ? 'current' : '');
    const line = i < STAGES.length - 1
      ? `<div class="stage-line ${i < currentIndex ? 'done':''}"></div>`
      : '';
    return `
      <div class="stage-node-wrap">
        <button class="stage-node ${state}" data-stage="${stage}">
          <span class="dot"></span>
          <span class="label">${stage}</span>
        </button>
        ${line}
      </div>
    `;
  }).join('');
  track.querySelectorAll('.stage-node').forEach(btn=>{
    btn.addEventListener('click', ()=> setStatus(app.id, btn.dataset.stage));
  });
}

function setStatus(id, status){
  const app = apps.find(a=>a.id===id);
  if(app){
    app.status = status;
    // TODO: persist status change to your backend here
  }
  render();
}

// ================= ADD APPLICATION MODAL =================
const overlay = document.getElementById('overlay');

document.getElementById('addBtn').addEventListener('click', ()=>{
  ['f-company','f-role','f-location','f-url','f-skills'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-date').value = new Date().toISOString().slice(0,10);
  overlay.classList.add('open');
});
document.getElementById('cancelBtn').addEventListener('click', ()=> overlay.classList.remove('open'));
overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.classList.remove('open'); });

document.getElementById('saveBtn').addEventListener('click', ()=>{
  const company = document.getElementById('f-company').value.trim();
  const role = document.getElementById('f-role').value.trim();
  if(!company || !role){
    alert('Company and role are required.');
    return;
  }
  const newApp = {
    id: uid('app'),
    company,
    role,
    location: document.getElementById('f-location').value.trim(),
    dateApplied: document.getElementById('f-date').value || new Date().toISOString().slice(0,10),
    url: document.getElementById('f-url').value.trim(),
    skills: document.getElementById('f-skills').value.split(',').map(s=>s.trim()).filter(Boolean),
    status: "Applied",
    notes: ""
  };
  // TODO: replace with a real call to your backend, e.g.
  //   const res = await fetch('/api/applications', { method:'POST', body: JSON.stringify(newApp) });

  apps.unshift(newApp);
  selectedId = newApp.id;
  overlay.classList.remove('open');
  render();
});

document.getElementById('searchInput').addEventListener('input', (e)=>{
  searchTerm = e.target.value;
  render();
});

// ================= TEAM & ROLES (AUTHORISATION UI) =================
document.getElementById('inviteForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = document.getElementById('invite-email').value.trim();
  const role = document.getElementById('invite-role').value;
  if(!email) return;

  // TODO: replace with a real call to your backend, e.g.
  //   await fetch('/api/team/invite', { method:'POST', body: JSON.stringify({email, role}) });

  teamUsers.push({ id: uid('user'), email, role, status: 'Invited' });
  document.getElementById('invite-email').value = '';
  renderUserTable();
});

function renderUserTable(){
  const wrap = document.getElementById('userTableWrap');

  if(teamUsers.length === 0){
    wrap.innerHTML = `<p class="no-users">No one has been invited yet.</p>`;
    return;
  }

  wrap.innerHTML = `
    <table class="user-table">
      <thead>
        <tr><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        ${teamUsers.map(u => `
          <tr data-id="${u.id}">
            <td>${escapeHtml(u.email)}</td>
            <td>
              <select class="role-select" data-id="${u.id}">
                <option value="Member" ${u.role==='Member'?'selected':''}>Member</option>
                <option value="Admin" ${u.role==='Admin'?'selected':''}>Admin</option>
              </select>
            </td>
            <td>${escapeHtml(u.status)}</td>
            <td><button class="remove-user" data-id="${u.id}">Remove</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('.role-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      const user = teamUsers.find(u=>u.id===sel.dataset.id);
      if(user){
        user.role = sel.value;
        // TODO: persist role change to your backend here
      }
    });
  });

  wrap.querySelectorAll('.remove-user').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      // TODO: call your backend to revoke access here
      teamUsers = teamUsers.filter(u=>u.id!==btn.dataset.id);
      renderUserTable();
    });
  });
}

// ================= HELPERS =================
function escapeHtml(str){
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
function escapeAttr(str){ return escapeHtml(str); }
function formatDate(d){
  if(!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  if(isNaN(dt)) return d;
  return dt.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
}