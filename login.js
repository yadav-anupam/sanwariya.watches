// login.js
// Modular Client Sign In Controller for Sanwariya Watches

import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('remember-me');
  const btnSubmit = document.getElementById('btn-submit');
  const submitLoader = document.getElementById('submit-loader');
  const submitText = document.getElementById('submit-text');
  
  const alertError = document.getElementById('alert-error');
  const alertErrorText = document.getElementById('alert-error-text');
  const alertSuccess = document.getElementById('alert-success');
  const alertSuccessText = document.getElementById('alert-success-text');
  
  const togglePasswordBtn = document.getElementById('toggle-password');
  const loadingOverlay = document.getElementById('auth-loading-overlay');

  // Load last remember me preference
  if (rememberMeCheckbox) {
    rememberMeCheckbox.checked = localStorage.getItem('remember_me') === 'true';
  }

  // Handle URL Session Expiration parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('expired') === 'true') {
    showError('Your session has expired. Please log in again.');
  }

  // Session Check on Load
  async function checkSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session) {
        // Authenticated. Check role and redirect.
        const userId = session.user.id;
        const { data: adminData } = await supabase
          .from('admins')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (adminData) {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/index.html';
        }
      } else {
        hideOverlay();
      }
    } catch (err) {
      console.error('Session check failed:', err);
      hideOverlay();
    }
  }

  function hideOverlay() {
    if (loadingOverlay) {
      loadingOverlay.classList.add('opacity-0');
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');
      }, 300);
    }
  }

  checkSession();

  // Handle Show/Hide Password
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePasswordBtn.textContent = isPassword ? 'HIDE' : 'SHOW';
    });
  }

  // Handle Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showError('Please complete all fields to sign in.');
        return;
      }

      // Front-end email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Invalid email format. Please enter a valid email address.');
        return;
      }

      // Enter Loading State
      setLoading(true);
      hideAlerts();

      // Store Remember Me preference
      const remember = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
      localStorage.setItem('remember_me', remember ? 'true' : 'false');

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        showSuccess(`Welcome back! Authenticated as ${data.user?.email || 'Premium Member'}.`);
        
        // Check role and redirect
        const { data: adminData } = await supabase
          .from('admins')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        setTimeout(() => {
          if (adminData) {
            window.location.href = '/admin.html';
          } else {
            window.location.href = '/index.html';
          }
        }, 1200);

      } catch (err) {
        console.error('Sign-in error:', err);
        setLoading(false);
        
        const errMsg = err.message || '';
        if (errMsg.includes('Invalid login credentials') || errMsg.toLowerCase().includes('invalid credential') || errMsg.toLowerCase().includes('password')) {
          showError('Incorrect password or user account not found. Please try again.');
        } else if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('user_not_found')) {
          showError('User not found. Please verify your credentials or sign up.');
        } else if (errMsg.toLowerCase().includes('disabled') || errMsg.toLowerCase().includes('banned') || errMsg.toLowerCase().includes('unauthorized')) {
          showError('Account disabled. Your access has been restricted by administration.');
        } else if (errMsg.toLowerCase().includes('fetch') || errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('timeout')) {
          showError('Network error. Please check your internet connection and try again.');
        } else {
          showError(err.message || 'Verification failed. Please check credentials and try again.');
        }
      }
    });
  }

  // Helper Functions
  function setLoading(loading) {
    if (loading) {
      btnSubmit.disabled = true;
      submitLoader.classList.remove('hidden');
      submitText.textContent = 'Verifying Credentials...';
      emailInput.disabled = true;
      passwordInput.disabled = true;
      if (rememberMeCheckbox) rememberMeCheckbox.disabled = true;
    } else {
      btnSubmit.disabled = false;
      submitLoader.classList.add('hidden');
      submitText.textContent = 'Sign In To Account';
      emailInput.disabled = false;
      passwordInput.disabled = false;
      if (rememberMeCheckbox) rememberMeCheckbox.disabled = false;
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
