/*
  

  currentUser is read by app.js to decide what's shown (e.g. the
  "Team & roles" tab only appears when currentUser.role == "Admin").
*/

let currentUser = null; // { name, email, role } once "signed in"

const views = {
  login: document.getElementById('loginView'),
  register: document.getElementById('registerView'),
  forgot: document.getElementById('forgotView'),
  app: document.getElementById('appView'),
};

function showView(name){
  Object.values(views).forEach(v => v.hidden = true);
  views[name].hidden = false;
}

// ---------- navigation between auth screens ----------
document.getElementById('toRegister').addEventListener('click', (e)=>{
  e.preventDefault();
  clearErrors();
  showView('register');
});
document.getElementById('toForgot').addEventListener('click', (e)=>{
  e.preventDefault();
  clearErrors();
  showView('forgot');
});
document.getElementById('toLoginFromRegister').addEventListener('click', (e)=>{
  e.preventDefault();
  clearErrors();
  showView('login');
});
document.getElementById('toLoginFromForgot').addEventListener('click', (e)=>{
  e.preventDefault();
  clearErrors();
  showView('login');
});

function clearErrors(){
  document.getElementById('loginError').hidden = true;
  document.getElementById('registerError').hidden = true;
  document.getElementById('forgotNote').hidden = true;
}

// ---------- login ----------
document.getElementById('loginForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('loginError');

  if(!email || !password){
    errorEl.textContent = 'Enter your email and password.';
    errorEl.hidden = false;
    return;
  }

  handleLogin(email, password);
});

function handleLogin(email, password){
  // TODO: replace with a real call to your backend, e.g.
  //   const res = await fetch('/api/auth/login', { method:'POST', body: JSON.stringify({email, password}) });
  //   if (!res.ok) { show error; return; }
  //   currentUser = await res.json();

  // UI-only placeholder: signs the entered email in as a Member.
  currentUser = {
    name: email.split('@')[0],
    email,
    role: 'Member'
  };
  enterApp();
}

// ---------- register ----------
document.getElementById('registerForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const role = document.getElementById('reg-role').value;
  const errorEl = document.getElementById('registerError');

  if(!name || !email || !password){
    errorEl.textContent = 'Fill in all fields.';
    errorEl.hidden = false;
    return;
  }
  if(password !== confirm){
    errorEl.textContent = 'Passwords do not match.';
    errorEl.hidden = false;
    return;
  }

  handleRegister(name, email, password, role);
});

function handleRegister(name, email, password, role){
  // TODO: replace with a real call to your backend, e.g.
  //   const res = await fetch('/api/auth/register', { method:'POST', body: JSON.stringify({name, email, password, role}) });
  //   currentUser = await res.json();

  currentUser = { name, email, role };
  enterApp();
}

// ---------- forgot password ----------
document.getElementById('forgotForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  if(!email) return;
  handleForgotPassword(email);
});

function handleForgotPassword(email){
  // TODO: replace with a real call to your backend, e.g.
  //   await fetch('/api/auth/forgot-password', { method:'POST', body: JSON.stringify({email}) });

  const note = document.getElementById('forgotNote');
  note.hidden = false;
}

// ---------- logout ----------
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  handleLogout();
});

function handleLogout(){
  // TODO: replace with a real call to your backend, e.g.
  //   await fetch('/api/auth/logout', { method:'POST' });

  currentUser = null;
  showView('login');
  document.getElementById('loginForm').reset();
}

// ---------- user menu dropdown ----------
document.getElementById('userChipBtn').addEventListener('click', (e)=>{
  e.stopPropagation();
  const dd = document.getElementById('userDropdown');
  dd.hidden = !dd.hidden;
});
document.addEventListener('click', ()=>{
  document.getElementById('userDropdown').hidden = true;
});

// ---------- enter app after login/register ----------
function enterApp(){
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.role;

  const teamTab = document.getElementById('teamTab');
  const isAdmin = currentUser.role === 'Admin';
  teamTab.hidden = !isAdmin;

  showView('app');

  // if a non-admin was on the team tab somehow, fall back to applications
  if(!isAdmin){
    switchTab('applications');
  }

  if(typeof onAppEntered === 'function'){
    onAppEntered(); // defined in app.js — triggers initial render
  }
}

// ---------- tab switching (Applications / Team & roles) ----------
document.getElementById('tabs').addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab');
  if(!btn) return;
  switchTab(btn.dataset.tab);
});

function switchTab(name){
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.getElementById('applicationsTab').hidden = name !== 'applications';
  document.getElementById('teamTabContent').hidden = name !== 'team';

  if(name === 'team' && typeof renderUserTable === 'function'){
    renderUserTable(); // defined in app.js
  }
}