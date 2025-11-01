/**
 * Welcome Slider Component
 * Multi-slide carousel introducing DeyaRun app features
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  TrophyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Slide {
  id: number;
  title: string;
  description: string;
  icon: JSX.Element;
  color: string;
}

interface WelcomeSliderProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const WelcomeSlider = ({ onComplete, onSkip }: WelcomeSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 0,
      title: 'Sveicināti DeyaRun!',
      description: 'Jūsu personīgais skriešanas treneris. Sasniedziet savus mērķus ar AI-balstītiem treniņu plāniem.',
      icon: <SparklesIcon className="w-16 h-16" />,
      color: 'from-coral to-orange-500'
    },
    {
      id: 1,
      title: 'Sekojiet Saviem Skrējieniem',
      description: 'GPS izsekošana, distance, temps un precīza maršruta vizualizācija. Viss, ko jums nepieciešams vienuviet.',
      icon: <MapPinIcon className="w-16 h-16" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'Personalizēti Treniņi',
      description: 'AI izveido individuālu treniņu plānu, kas pielāgots jūsu līmenim, mērķiem un fiziskajai formai.',
      icon: <ChartBarIcon className="w-16 h-16" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 3,
      title: 'Savienojiet Ierīces',
      description: 'Sinhronizējiet datus no Strava, Garmin, Google Fit un citām ierīcēm. Viss vienuviet.',
      icon: <DevicePhoneMobileIcon className="w-16 h-16" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 4,
      title: 'Sasniedziet Mērķus',
      description: 'Sekojiet progresam, saņemiet sasniegumu nozīmītes un motivējiet sevi sasniegt jaunus rekordus!',
      icon: <TrophyIcon className="w-16 h-16" />,
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Skip Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            Izlaist
          </button>
        </div>

        {/* Slider Container */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${currentSlideData.color} mb-8 shadow-lg`}>
                <div className="text-white">
                  {currentSlideData.icon}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {currentSlideData.title}
              </h2>

              {/* Description */}
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
                {currentSlideData.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex justify-center items-center space-x-3 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-8 h-3 bg-coral'
                    : 'w-3 h-3 bg-slate-600 hover:bg-slate-500'
                }`}
                aria-label={`Iet uz ${index + 1}. slaidu`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                currentSlide === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-slate-700 text-white'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="hidden md:inline">Atpakaļ</span>
            </button>

            <button
              onClick={nextSlide}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-coral to-orange-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold"
            >
              <span>{isLastSlide ? 'Sākt' : 'Tālāk'}</span>
              {!isLastSlide && <ChevronRightIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Slide Counter */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          {currentSlide + 1} no {slides.length}
        </div>
      </div>
    </div>
  );
};
