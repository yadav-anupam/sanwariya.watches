// forgot-password.js
// Secure password reset request handler

import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const forgotForm = document.getElementById('forgot-form');
  const emailInput = document.getElementById('email');
  const btnSubmit = document.getElementById('btn-submit');
  const submitLoader = document.getElementById('submit-loader');
  const submitText = document.getElementById('submit-text');
  
  const alertError = document.getElementById('alert-error');
  const alertErrorText = document.getElementById('alert-error-text');
  const alertSuccess = document.getElementById('alert-success');
  const alertSuccessText = document.getElementById('alert-success-text');

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();

      // Simple email validation regex check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return;
      }

      // Enter Loading State
      setLoading(true);
      hideAlerts();

      try {
        // Build redirection URI dynamically based on the current window location
        // to prevent hardcoded domain breakages in Dev / Sandbox/ Shared / Production URLs.
        const redirectToUrl = `${window.location.origin}/update-password.html`;
        console.log('Dispatching reset email with redirectTo route:', redirectToUrl);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectToUrl,
        });

        if (error) {
          throw error;
        }

        // Show Success
        showSuccess('Check your inbox! We have dispatched a secure passcode recovery link to your email.');
        emailInput.value = ''; // Reset input on success
        
      } catch (err) {
        console.error('Password reset dispatch failed:', err);
        showError(err.message || 'Failed to dispatch reset instructions. Please verify registration.');
      } finally {
        setLoading(false);
      }
    });
  }

  // Helper UI Handlers
  function setLoading(loading) {
    if (loading) {
      btnSubmit.disabled = true;
      submitLoader.classList.remove('hidden');
      submitText.textContent = 'Sending Security Link...';
    } else {
      btnSubmit.disabled = false;
      submitLoader.classList.add('hidden');
      submitText.textContent = 'Send Secure Reset Link';
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
