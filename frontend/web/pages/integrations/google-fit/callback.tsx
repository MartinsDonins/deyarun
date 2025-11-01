import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function GoogleFitCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Google Fit authorization...');

  useEffect(() => {
    const { success, error, message: successMessage } = router.query;

    // Backend redirected with success/error parameters
    if (success === 'true') {
      setStatus('success');
      setMessage(successMessage as string || 'Google Fit connected successfully!');

      // Send success message to parent window (without COOP issues since same origin)
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'GOOGLE_FIT_AUTH_SUCCESS'
          }, window.location.origin);
        } catch (e) {
          console.error('Failed to send message to parent:', e);
        }
      }

      // Close popup after 1.5 seconds
      setTimeout(() => {
        window.close();
      }, 1500);
      return;
    }

    if (success === 'false' && error) {
      setStatus('error');
      setMessage(decodeURIComponent(error as string));

      // Send error to parent window
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'GOOGLE_FIT_AUTH_ERROR',
            error: decodeURIComponent(error as string)
          }, window.location.origin);
        } catch (e) {
          console.error('Failed to send message to parent:', e);
        }
      }

      // Close popup after 3 seconds
      setTimeout(() => {
        window.close();
      }, 3000);
      return;
    }

    // If no parameters yet, wait for router to populate
    if (Object.keys(router.query).length === 0) {
      return;
    }

    // If unexpected state, close after timeout
    setTimeout(() => {
      window.close();
    }, 3000);
  }, [router.query]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">This window will close automatically.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-white font-semibold mb-2">Success!</p>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Closing...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">✕</div>
            <p className="text-white font-semibold mb-2">Authorization Failed</p>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">This window will close automatically.</p>
          </>
        )}
      </div>
    </div>
  );
}