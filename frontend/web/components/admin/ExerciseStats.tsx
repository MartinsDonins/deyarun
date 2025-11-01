import React from 'react';

interface ExerciseStatsData {
  stats: Array<{
    _id: string;
    count: number;
    avgRating: number;
    totalUsage: number;
  }>;
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
}

interface ExerciseStatsProps {
  stats: ExerciseStatsData;
}

const CATEGORY_LABELS: Record<string, string> = {
  'warm-up': 'Iesildīšana',
  'strength': 'Spēka vingrinājumi',
  'flexibility': 'Elastība',
  'balance': 'Līdzsvars',
  'coordination': 'Koordinācija',
  'plyometric': 'Pliometrija',
  'core': 'Vēdera muskulatūra',
  'recovery': 'Atjaunošanās',
  'cool-down': 'Nomierināšana',
  'technique': 'Skriešanas tehnika',
  'cardio': 'Kardio'
};

export default function ExerciseStats({ stats }: ExerciseStatsProps) {
  const { summary, stats: categoryStats } = stats;
  
  // Sort categories by count (descending)
  const sortedStats = [...categoryStats].sort((a, b) => b.count - a.count);
  
  // Calculate percentages
  const totalExercises = summary.total;
  const activePercentage = totalExercises > 0 ? (summary.active / totalExercises) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Summary Cards */}
      <div className="lg:col-span-1 space-y-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Exercises</p>
              <p className="text-2xl font-bold text-white">{summary.total}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Exercises</p>
              <p className="text-2xl font-bold text-green-400">{summary.active}</p>
              <p className="text-xs text-gray-500">{activePercentage.toFixed(1)}% of total</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Inactive Exercises</p>
              <p className="text-2xl font-bold text-red-400">{summary.inactive}</p>
              <p className="text-xs text-gray-500">{(100 - activePercentage).toFixed(1)}% of total</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Category Distribution</h3>
            <div className="text-sm text-gray-400">
              Total Usage: {categoryStats.reduce((sum, stat) => sum + stat.totalUsage, 0)}
            </div>
          </div>
          
          <div className="space-y-3">
            {sortedStats.map((stat) => {
              const categoryLabel = CATEGORY_LABELS[stat._id] || stat._id;
              const percentage = totalExercises > 0 ? (stat.count / totalExercises) * 100 : 0;
              
              return (
                <div key={stat._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-white">{categoryLabel}</span>
                      <span className="text-xs text-gray-400">({stat.count} exercises)</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-gray-400">
                        <span className="text-yellow-400">⭐</span> {stat.avgRating.toFixed(1)}
                      </div>
                      <div className="text-gray-400">
                        {stat.totalUsage} uses
                      </div>
                      <div className="text-coral font-medium">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-coral to-orange-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {sortedStats.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-400">No exercise statistics available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Categories */}
      <div className="lg:col-span-3">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Categories</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Most Used */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Most Used</h4>
              {(() => {
                const mostUsed = sortedStats.reduce((prev, current) => 
                  (current.totalUsage > prev.totalUsage) ? current : prev
                , sortedStats[0]);
                
                return mostUsed ? (
                  <div>
                    <div className="text-lg font-bold text-white">
                      {CATEGORY_LABELS[mostUsed._id] || mostUsed._id}
                    </div>
                    <div className="text-sm text-coral">
                      {mostUsed.totalUsage} total uses
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No data</div>
                );
              })()}
            </div>

            {/* Highest Rated */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Highest Rated</h4>
              {(() => {
                const highestRated = sortedStats.reduce((prev, current) => 
                  (current.avgRating > prev.avgRating) ? current : prev
                , sortedStats[0]);
                
                return highestRated ? (
                  <div>
                    <div className="text-lg font-bold text-white">
                      {CATEGORY_LABELS[highestRated._id] || highestRated._id}
                    </div>
                    <div className="text-sm text-yellow-400">
                      ⭐ {highestRated.avgRating.toFixed(1)} average
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No data</div>
                );
              })()}
            </div>

            {/* Most Exercises */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Most Exercises</h4>
              {sortedStats[0] ? (
                <div>
                  <div className="text-lg font-bold text-white">
                    {CATEGORY_LABELS[sortedStats[0]._id] || sortedStats[0]._id}
                  </div>
                  <div className="text-sm text-blue-400">
                    {sortedStats[0].count} exercises
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}