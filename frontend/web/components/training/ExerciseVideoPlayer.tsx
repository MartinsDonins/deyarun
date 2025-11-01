import { useEffect, useRef } from 'react'

interface Exercise {
  exerciseId: string
  name: string
  description: string
  videoUrl: string
  duration?: {
    min: number
    max: number
  }
  repetitions?: {
    min: number
    max: number
  }
  sets?: {
    min: number
    max: number
  }
  targetMuscles?: string[]
}

interface ExerciseVideoPlayerProps {
  exercise: Exercise
  onClose: () => void
}

export default function ExerciseVideoPlayer({ exercise, onClose }: ExerciseVideoPlayerProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose()
    }
  }

  // Determine video provider from URL
  const getVideoEmbed = (url: string) => {
    // Vimeo
    if (url.includes('vimeo.com')) {
      const vimeoId = url.split('/').pop()
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )
    }

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be')
        ? url.split('/').pop()
        : new URLSearchParams(new URL(url).search).get('v')
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }

    // Firebase or direct video URL
    return (
      <video
        src={url}
        controls
        autoPlay
        className="w-full h-full"
        controlsList="nodownload"
      >
        Your browser does not support the video tag.
      </video>
    )
  }

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
            <p className="text-sm text-gray-600">{exercise.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black" style={{ paddingTop: '56.25%' }}>
          <div className="absolute inset-0">
            {getVideoEmbed(exercise.videoUrl)}
          </div>
        </div>

        {/* Exercise Details */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Duration */}
            {exercise.duration && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">⏱️</span>
                  <h4 className="font-semibold text-gray-900">Ilgums</h4>
                </div>
                <p className="text-gray-600">
                  {exercise.duration.min}-{exercise.duration.max} sekundes
                </p>
              </div>
            )}

            {/* Repetitions */}
            {exercise.repetitions && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🔄</span>
                  <h4 className="font-semibold text-gray-900">Atkārtojumi</h4>
                </div>
                <p className="text-gray-600">
                  {exercise.repetitions.min}-{exercise.repetitions.max} reizes
                  {exercise.sets && exercise.sets.min > 0 && (
                    <span className="block text-sm text-gray-500">
                      {exercise.sets.min} {exercise.sets.min === 1 ? 'sērija' : 'sērijas'}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Target Muscles */}
            {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💪</span>
                  <h4 className="font-semibold text-gray-900">Mērķa muskuļi</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {exercise.targetMuscles.map((muscle, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Izpildes instrukcija</h4>
                <p className="text-sm text-blue-800">{exercise.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Aizvērt
          </button>
        </div>
      </div>
    </div>
  )
}
