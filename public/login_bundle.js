document.addEventListener('DOMContentLoaded', ()=>{ 
  const form = document.getElementById('loginForm');
  const msgDiv = document.getElementById('msg');
  
  form.addEventListener('submit', async (e)=>{ 
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { 
      username: fd.get('username'), 
      password: fd.get('password') 
    };

    try {
      const res = await fetch('/auth/login', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();

      if(data.success) {
        location.href='/dashboard.html';
      } else if(data.requiresVerification) {
        // Show verification needed message
        msgDiv.className = 'msg warning';
        msgDiv.innerHTML = `
          <p>Please verify your email first</p>
          <p>We sent a verification link to ${data.email}</p>
          <p><a href="/verify-email.html">Need to resend the verification email?</a></p>
        `;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch(err) {
      msgDiv.className = 'msg error';
      msgDiv.textContent = err.message || 'Login failed';
    }
  }); 
});
