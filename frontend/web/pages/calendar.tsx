import dynamic from 'next/dynamic';

// Export the entire calendar page as client-side only to avoid SSR issues with theme context
const CalendarPage = dynamic(() => import('../components/CalendarPageComponent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading calendar...</p>
      </div>
    </div>
  )
});

export default CalendarPage;