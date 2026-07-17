// update-password.js
// Secure password update controller with manual OTP fallback
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const updateForm = document.getElementById('update-form');
  const verifyOtpForm = document.getElementById('verify-otp-form');
  
  const verifyEmailInput = document.getElementById('verify-email');
  const verifyTokenInput = document.getElementById('verify-token');
  const btnVerify = document.getElementById('btn-verify');
  const verifyLoader = document.getElementById('verify-loader');
  const verifyBtnText = document.getElementById('verify-btn-text');

  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const btnSubmit = document.getElementById('btn-submit');
  const submitLoader = document.getElementById('submit-loader');
  const submitText = document.getElementById('submit-text');
  
  const alertError = document.getElementById('alert-error');
  const alertErrorText = document.getElementById('alert-error-text');
  const alertSuccess = document.getElementById('alert-success');
  const alertSuccessText = document.getElementById('alert-success-text');
  const sessionWarning = document.getElementById('session-warning');
  
  const toggleNewPasswordBtn = document.getElementById('toggle-new-password');

  // Cache Rules DOM Nodes
  const rules = {
    minLength: { element: document.getElementById('rule-min-length'), test: (p) => p.length >= 8 },
    uppercase: { element: document.getElementById('rule-uppercase'), test: (p) => /[A-Z]/.test(p) },
    lowercase: { element: document.getElementById('rule-lowercase'), test: (p) => /[a-z]/.test(p) },
    number: { element: document.getElementById('rule-number'), test: (p) => /[0-9]/.test(p) },
    match: { element: document.getElementById('rule-match'), test: (p, c) => p && p === c },
  };

  // Check Active Session Presence on Load
  const initSessionCheck = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Secure recovery session verified successfully for:', session.user?.email);
        verifyOtpForm.classList.add('hidden');
        updateForm.classList.remove('hidden');
        sessionWarning.classList.add('hidden');
        return;
      }
    } catch (e) {
      console.warn('Initial session lookup error:', e);
    }

    // Try parsing URL query parameter ?token=
    const params = new URLSearchParams(window.location.search);
    const tokenQuery = params.get('token');
    const emailQuery = params.get('email') || params.get('username');

    if (emailQuery) {
      verifyEmailInput.value = emailQuery;
    }
    if (tokenQuery) {
      verifyTokenInput.value = tokenQuery;
    }

    // Check if there is an active hash in the URL (indicating direct redirect parsed by Supabase)
    if (window.location.hash.includes('access_token=') || window.location.hash.includes('type=recovery')) {
      console.log('Hash token detected. Waiting for Supabase client parser...');
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          verifyOtpForm.classList.add('hidden');
          updateForm.classList.remove('hidden');
          sessionWarning.classList.add('hidden');
        } else {
          sessionWarning.classList.remove('hidden');
          verifyOtpForm.classList.remove('hidden');
        }
      }, 800);
      return;
    }

    // Show warnings and manual OTP section
    sessionWarning.classList.remove('hidden');
    verifyOtpForm.classList.remove('hidden');
  };

  initSessionCheck();

  // Handle Step 1: Verification Form Submission
  if (verifyOtpForm) {
    verifyOtpForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      let email = verifyEmailInput.value.trim();
      let rawToken = verifyTokenInput.value.trim();
      let token = rawToken;

      // Extract token if they pasted a full URL
      if (rawToken.includes('token=')) {
        const match = rawToken.match(/[?&]token=([^&]+)/);
        if (match && match[1]) {
          token = match[1];
        }
      } else if (rawToken.includes('access_token=')) {
        const match = rawToken.match(/[#&]access_token=([^&]+)/);
        if (match && match[1]) {
          token = match[1];
        }
      }

      // Extract email from URL if pasted in token field
      if (rawToken.includes('email=')) {
        const emailMatch = rawToken.match(/[?&]email=([^&]+)/);
        if (emailMatch && emailMatch[1]) {
          email = decodeURIComponent(emailMatch[1]);
          verifyEmailInput.value = email;
        }
      }

      setVerifyLoading(true);
      hideAlerts();

      try {
        console.log(`Verifying recovery sequence with email: ${email}`);
        const { data, error } = await supabase.auth.verifyOtp({
          email: email,
          token: token,
          type: 'recovery'
        });

        if (error) {
          throw error;
        }

        console.log('Recovery verification successful. Session context:', data);
        
        // Transition step views
        verifyOtpForm.classList.add('hidden');
        updateForm.classList.remove('hidden');
        sessionWarning.classList.add('hidden');

        showSuccess('Identity verified! Create and confirm your new administrator passcode below.');
      } catch (err) {
        console.error('OTP / Token verification error:', err);
        showError(err.message || 'Verification failed. Please confirm that your email address matches your user account, and the token code is correct.');
      } finally {
        setVerifyLoading(false);
      }
    });
  }

  // Toggle Password Mask
  if (toggleNewPasswordBtn) {
    toggleNewPasswordBtn.addEventListener('click', () => {
      const isPassword = newPasswordInput.getAttribute('type') === 'password';
      newPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
      confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
      toggleNewPasswordBtn.textContent = isPassword ? 'HIDE' : 'SHOW';
    });
  }

  // Real-time Validation Updates
  function checkPasswordRules() {
    const password = newPasswordInput.value;
    const confirm = confirmPasswordInput.value;

    let allValid = true;

    // Check each requirement
    Object.keys(rules).forEach((key) => {
      const rule = rules[key];
      const isValid = rule.test(password, confirm);
      
      const icon = rule.element.querySelector('.rule-icon');
      
      if (isValid) {
        icon.textContent = '🟢';
        rule.element.classList.remove('text-neutral-400');
        rule.element.classList.add('text-green-400', 'font-semibold');
      } else {
        icon.textContent = '🔴';
        rule.element.classList.remove('text-green-400', 'font-semibold');
        rule.element.classList.add('text-neutral-400');
        allValid = false;
      }
    });

    return allValid;
  }

  newPasswordInput.addEventListener('input', checkPasswordRules);
  confirmPasswordInput.addEventListener('input', checkPasswordRules);

  // Handle Form Submission
  if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = newPasswordInput.value;

      // Run validation checks
      const isPassValid = checkPasswordRules();
      if (!isPassValid) {
        showError('Please satisfy all password security requirements before submission.');
        return;
      }

      setLoading(true);
      hideAlerts();

      try {
        // Execute Supabase Auth password update
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) {
          throw error;
        }

        // Show Success and Notify
        showSuccess('Your passcode has been successfully updated! Redirecting to sign in screen...');
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        checkPasswordRules(); // Refresh checklists to green/reset state

        // Redirect after 3 seconds exactly
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 3000);

      } catch (err) {
        console.error('Password update failure:', err);
        showError(err.message || 'Failed to update passcode. Session may have expired or timed out.');
        setLoading(false);
      }
    });
  }

  // Helper UI Utilities
  function setVerifyLoading(loading) {
    if (loading) {
      btnVerify.disabled = true;
      verifyLoader.classList.remove('hidden');
      verifyBtnText.textContent = 'Authenticating security token...';
    } else {
      btnVerify.disabled = false;
      verifyLoader.classList.add('hidden');
      verifyBtnText.textContent = 'Authenticate Recovery Session';
    }
  }

  function setLoading(loading) {
    if (loading) {
      btnSubmit.disabled = true;
      submitLoader.classList.remove('hidden');
      submitText.textContent = 'Updating Password Vault...';
    } else {
      btnSubmit.disabled = false;
      submitLoader.classList.add('hidden');
      submitText.textContent = 'Update Password Vault';
    }
  }

  function showError(msg) {
    alertErrorText.textContent = msg;
    alertError.classList.remove('hidden');
    alertSuccess.classList.add('hidden');
  }

  function showSuccess(msg) {
    alertSuccessText.textContent = msg;
    alertSuccess.classList.remove('hidden');
    alertError.classList.add('hidden');
  }

  function hideAlerts() {
    alertError.classList.add('hidden');
    alertSuccess.classList.add('hidden');
  }
});
