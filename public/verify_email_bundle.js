document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('verificationStatus');
  const resendContainer = document.getElementById('resendContainer');
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    statusDiv.className = 'msg error';
    statusDiv.textContent = 'Invalid verification link';
    resendContainer.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();

    if (data.success) {
      statusDiv.className = 'msg success';
      statusDiv.textContent = 'Email verified successfully! Redirecting to dashboard...';
      setTimeout(() => { location.href = '/dashboard.html'; }, 2000);
    } else {
      throw new Error(data.error || 'Verification failed');
    }
  } catch (err) {
    statusDiv.className = 'msg error';
    statusDiv.textContent = err.message || 'Verification failed';
    resendContainer.style.display = 'block';
  }

  // Handle resend verification
  document.getElementById('resendForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    
    try {
      const res = await fetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        statusDiv.className = 'msg success';
        statusDiv.textContent = 'Verification email sent! Please check your inbox.';
      } else {
        throw new Error(data.error || 'Failed to resend verification email');
      }
    } catch (err) {
      statusDiv.className = 'msg error';
      statusDiv.textContent = err.message || 'Failed to resend verification email';
    }
  });
});