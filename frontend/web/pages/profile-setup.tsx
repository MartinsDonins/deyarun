/**
 * Profile Setup Page - Stage 2 of Onboarding
 * Multi-step form for collecting user data
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import { ProfileSetupForm } from '../components/onboarding/ProfileSetupForm';
import Head from 'next/head';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (data: any) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Nav autorizācijas tokena');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';

      const response = await axios.post(
        `${apiUrl}/api/users/onboarding`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Profils veiksmīgi saglabāts!');

        // Clear draft data
        localStorage.removeItem('onboarding-draft');

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Nezināma kļūda');
      }
    } catch (err: any) {
      console.error('Onboarding submission error:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Neizdevās saglabāt datus';
      setError(errorMessage);
      toast.error(errorMessage);

      // Still redirect if it's a non-critical error
      if (err.response?.status === 404 || err.response?.status === 500) {
        toast('Dati saglabāti lokāli. Mēģiniet vēlreiz vēlāk.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    }
  };

  const handleBack = () => {
    router.push('/welcome');
  };

  return (
    <>
      <Head>
        <title>Profila Iestatīšana - DeyaRun</title>
        <meta name="description" content="Aizpildiet savu profilu personalizētiem treniņiem" />
      </Head>

      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      <ProfileSetupForm onComplete={handleComplete} onBack={handleBack} />
    </>
  );
}
