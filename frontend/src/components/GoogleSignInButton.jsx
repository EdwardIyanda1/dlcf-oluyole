import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '../api';

// Set VITE_GOOGLE_CLIENT_ID in your frontend .env — same client ID configured
// as GOOGLE_CLIENT_ID on the backend. Works for both participants and admins;
// which dashboard they land on is decided by the returned user.is_admin.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onSuccess, redirectTo = '/checkin' }) {
  const divRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const handleCredential = async (response) => {
      try {
        const res = await apiService.googleLogin(response.credential);
        toast.success('Signed in with Google!');
        if (onSuccess) onSuccess(res.data);
        else navigate(res.data.user?.is_admin ? '/admin' : redirectTo);
      } catch {
        toast.error('Google sign-in failed. Please try again.');
      }
    };

    const initialize = () => {
      if (!window.google?.accounts?.id || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        shape: 'pill',
      });
    };

    if (window.google?.accounts?.id) {
      initialize();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initialize;
      document.body.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={divRef} className="flex justify-center" />;
}