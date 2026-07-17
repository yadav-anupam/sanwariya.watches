// update-password.js
// Secure password update controller with real-time feedback

import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const updateForm = document.getElementById('update-form');
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

  // Check Active Session Presence
  // Supabase automatically parses URL recovery tokens on load. Let's verify we have a valid session context.
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      console.warn('No active recovery session was found on initialization.');
      // Show warning banner but don't strictly block form (as recovery tokens might be verified server-side or via hash).
      sessionWarning.classList.remove('hidden');
    } else {
      console.log('Secure recovery session verified successfully for:', session.user?.email);
    }
  });

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
      const confirm = confirmPasswordInput.value;

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
        showSuccess('Your password has been successfully updated! Redirecting to sign in screen...');
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        checkPasswordRules(); // Refresh checklists to green/reset state

        // Redirect after 3 seconds exactly as requested
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
