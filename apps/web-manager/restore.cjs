const fs = require('fs');
const path = require('path');

const files = [
  'src/features/layout/components/Sidebar.jsx',
  'src/features/server/components/ServerContent.jsx',
  'src/features/database/components/DemoDBContent.jsx'
];

const replacements = [
  [/bg-muted text-foreground font-semibold shadow-ob-inset/g, 'bg-primary/10 text-primary font-semibold'],
  [/shadow-ob-inset-light dark:shadow-ob-inset/g, ''],
  [/text-muted-foreground hover:bg-muted\/50 hover:text-foreground/g, 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'],
  [/text-muted-foreground hover:text-foreground/g, 'text-slate-600 hover:text-primary dark:text-slate-400'],
  [/hover:bg-muted\/50 hover:text-foreground/g, 'hover:bg-slate-50 dark:hover:bg-slate-800'],
  [/hover:bg-background\/50 hover:text-foreground/g, 'hover:bg-white/50 dark:hover:bg-slate-800'],
  [/text-muted-foreground opacity-80/g, 'text-slate-400'],
  [/text-muted-foreground/g, 'text-slate-500'],
  [/text-foreground/g, 'text-slate-900 dark:text-white'],
  [/bg-card/g, 'bg-white dark:bg-slate-900'],
  [/bg-muted\/50/g, 'bg-slate-50 dark:bg-slate-800/50'],
  [/bg-background\/80/g, 'bg-white/60 dark:bg-slate-900/60'],
  [/bg-background/g, 'bg-slate-50 dark:bg-[#0f1116]'],
  [/hover:bg-muted/g, 'hover:bg-slate-100 dark:hover:bg-slate-800'],
  [/bg-muted/g, 'bg-slate-100 dark:bg-slate-800'],
  [/border-border/g, 'border-slate-200 dark:border-slate-800']
];

files.forEach(file => {
  const filePath = path.join('/home/rathana/Desktop/design', file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });
  fs.writeFileSync(filePath, content);
  console.log(`Restored ${file}`);
});
