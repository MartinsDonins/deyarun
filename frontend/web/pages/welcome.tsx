/**
 * Welcome Page - Stage 1 of Onboarding
 * Introduction slider showcasing app features
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import { WelcomeSlider } from '../components/onboarding/WelcomeSlider';
import Head from 'next/head';

export default function WelcomePage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/profile-setup');
  };

  const handleSkip = () => {
    router.push('/profile-setup');
  };

  return (
    <>
      <Head>
        <title>Sveicināti DeyaRun</title>
        <meta name="description" content="Sāciet savu skriešanas ceļojumu ar DeyaRun" />
      </Head>
      <WelcomeSlider onComplete={handleComplete} onSkip={handleSkip} />
    </>
  );
}
