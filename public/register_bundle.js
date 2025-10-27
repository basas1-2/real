document.addEventListener('DOMContentLoaded', ()=>{ 
  const form = document.getElementById('regForm');
  const msgDiv = document.getElementById('msg');
  
  form.addEventListener('submit', async (e)=>{ 
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      username: fd.get('username'),
      email: fd.get('email'),
      displayName: fd.get('displayName'),
      password: fd.get('password')
    };

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if(data.success) {
        form.style.display = 'none';
        msgDiv.className = 'msg success';
        msgDiv.innerHTML = `
          <h3>Registration Successful!</h3>
          <p>We've sent a verification email to <strong>${body.email}</strong></p>
          <p>Please check your inbox and click the verification link to activate your account.</p>
          <p>If you don't see the email, please check your spam folder.</p>
          <p><a href="/verify-email.html">Need to resend the verification email?</a></p>
        `;
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch(err) {
      msgDiv.className = 'msg error';
      msgDiv.textContent = err.message || 'Registration failed';
    }
  });
});
