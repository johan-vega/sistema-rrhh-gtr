const fs = require('fs');
const path = require('path');

const replacements = [
  // 1. Text changes in TS files (remove emojis)
  { file: 'src/app/features/worker/requests/new/worker-request-new.component.ts', replace: /⚠️ /g, with: '' },
  { file: 'src/app/features/worker/profile/worker-profile.component.ts', replace: /✅ /g, with: '' },
  { file: 'src/app/features/worker/profile/worker-profile.component.ts', replace: /❌ /g, with: '' },
  { file: 'src/app/features/worker/profile/worker-profile.component.ts', replace: /🔒 /g, with: '' },
  { file: 'src/app/features/hr/categories/hr-categories.component.ts', replace: /📅 /g, with: '' },
  { file: 'src/app/features/hr/categories/hr-categories.component.ts', replace: /📎 /g, with: '' },
  
  // 2. ui.components.ts: remove emoji from default icon, and change {{ icon() }} to [innerHTML]="icon()"
  // Wait, [innerHTML] needs bypassSecurityTrustHtml if using SVG, which might be overkill. Let's just hardcode a generic box SVG if no icon is passed.
  // Actually, let's just make it a <svg> inside the component template and forget about the `icon` input for simplicity, or change `icon` to take an svg string.
  {
    file: 'src/app/shared/components/ui.components.ts',
    replace: /<div class="empty-icon">{{ icon\(\) }}<\/div>/,
    with: '<div class="empty-icon" [innerHTML]="icon()"></div>'
  },
  {
    file: 'src/app/shared/components/ui.components.ts',
    replace: /icon     = input<string>\('📭'\);/,
    with: 'icon     = input<string>(\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>\');'
  },
  
  // 3. worker-notifications.component.ts & hr-notifications.component.ts
  {
    file: 'src/app/features/worker/notifications/worker-notifications.component.ts',
    replace: /icon="🔔"/,
    with: 'icon=\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>\''
  },
  {
    file: 'src/app/features/hr/notifications/hr-notifications.component.ts',
    replace: /🔔/,
    with: ''
  },
  {
    file: 'src/app/features/worker/requests/list/worker-requests-list.component.html',
    replace: /icon="📋"/,
    with: 'icon=\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>\''
  },

  // 4. status-badge
  {
    file: 'src/app/shared/components/status-badge/status-badge.component.ts',
    replace: /icon: '🟡'/g,
    with: 'icon: \'\'' // Remove emoji, rely on css circle if needed
  },
  {
    file: 'src/app/shared/components/status-badge/status-badge.component.ts',
    replace: /icon: '🔴'/g,
    with: 'icon: \'\''
  },
  {
    file: 'src/app/shared/components/status-badge/status-badge.component.ts',
    replace: /icon: '🟢'/g,
    with: 'icon: \'\''
  },

  // 5. HTML Files
  { file: 'src/app/app.html', replace: /🎉/, with: '' },
  
  // hr-dashboard
  { file: 'src/app/features/hr/dashboard/hr-dashboard.component.html', replace: /📋 /g, with: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> ' },
  { file: 'src/app/features/hr/dashboard/hr-dashboard.component.html', replace: /👤 /g, with: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' },
  { file: 'src/app/features/hr/dashboard/hr-dashboard.component.html', replace: /📅 /g, with: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' },

  // hr-request-detail
  { file: 'src/app/features/hr/requests/detail/hr-request-detail.component.html', replace: /📎 /g, with: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> ' },

  // hr-requests-list
  { file: 'src/app/features/hr/requests/list/hr-requests-list.component.html', replace: /📅 /g, with: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' },

  // worker-dashboard
  { file: 'src/app/features/worker/dashboard/worker-dashboard.component.html', replace: / 👋/g, with: '' },
  { file: 'src/app/features/worker/dashboard/worker-dashboard.component.html', replace: />📋</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32" style="vertical-align: middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><' },
  { file: 'src/app/features/worker/dashboard/worker-dashboard.component.html', replace: /📅 /g, with: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' },
  { file: 'src/app/features/worker/dashboard/worker-dashboard.component.html', replace: />📅</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><' },
  { file: 'src/app/features/worker/dashboard/worker-dashboard.component.html', replace: />👤</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><' },
  { file: 'src/app/features/worker/dashboard/worker-dashboard.component.html', replace: />🔔</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><' },

  // worker-requests-detail
  { file: 'src/app/features/worker/requests/detail/worker-request-detail.component.html', replace: />❌</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><' },
  { file: 'src/app/features/worker/requests/detail/worker-request-detail.component.html', replace: /📄 /g, with: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> ' },

  // worker-requests-list
  { file: 'src/app/features/worker/requests/list/worker-requests-list.component.html', replace: />📅/g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },

  // worker-request-new
  { file: 'src/app/features/worker/requests/new/worker-request-new.component.html', replace: />❌</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><' },
  { file: 'src/app/features/worker/requests/new/worker-request-new.component.html', replace: /⚠️ /g, with: '' },
  { file: 'src/app/features/worker/requests/new/worker-request-new.component.html', replace: />ℹ️</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><' },
  { file: 'src/app/features/worker/requests/new/worker-request-new.component.html', replace: />📎</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg><' },
  { file: 'src/app/features/worker/requests/new/worker-request-new.component.html', replace: />📄</g, with: '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><' }
];

replacements.forEach(({ file, replace, with: replacement }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(replace, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Replaced in ${file}`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});
