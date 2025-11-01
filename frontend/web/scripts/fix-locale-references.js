// Script to systematically replace lv-LV with en-US across web components
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'components/CalendarPageComponent.tsx',
  'components/dashboard/UserProfileSection.tsx', 
  'components/admin/ErrorNotifications.tsx',
  'components/dashboard/StravaWidget.tsx',
  'components/dashboard/ActivityFeed.tsx',
  'components/dashboard/NutritionWidget.tsx',
  'components/dashboard/AchievementsWidget.tsx',
  'components/dashboard/GoalTracking.tsx',
  'components/admin/SystemInfoPanel.tsx',
  'components/NotificationCenter.tsx',
  'components/admin/LogViewer.tsx',
  'components/subscription/SubscriptionDetails.tsx',
  'components/workouts/WeeklyWorkoutManager.tsx',
  'pages/admin/ai-usage.tsx',
  'pages/admin/dashboard.tsx',
  'pages/admin/news.tsx',
  'pages/admin/ai-reports.tsx',
  'pages/profile.tsx',
  'pages/admin/bug-reports.tsx',
  'pages/courses/[id].tsx',
  'pages/news/[id].tsx',
  'pages/users.tsx',
  'pages/support.tsx',
  'pages/bug-reports.tsx',
  'pages/news/index.tsx'
];

let totalReplacements = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Replace lv-LV with en-US
    content = content.replace(/lv-LV/g, 'en-US');
    
    if (content !== originalContent) {
      const replacements = (originalContent.match(/lv-LV/g) || []).length;
      console.log(`✅ ${filePath}: ${replacements} replacements`);
      totalReplacements += replacements;
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log(`\n🎯 TOTAL: ${totalReplacements} lv-LV → en-US replacements completed`);
console.log('✅ Locale standardization complete!');