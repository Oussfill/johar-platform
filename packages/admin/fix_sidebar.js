const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// We need to add useState to Sidebar.tsx
if (!code.includes('import { useState }')) {
  code = code.replace('import { useTranslation }', 'import { useState } from "react";\nimport { useTranslation }');
}

// Add state to component
code = code.replace(
  'const isRTL = i18n.language === \'ar\';',
  'const isRTL = i18n.language === \'ar\';\n  const [expandedSection, setExpandedSection] = useState<number | null>(0);'
);

// Modify the rendering logic to be collapsible
const renderRegex = /\{menuItems\.map\(\(section, idx\) => \([\s\S]*?<\/ul>\s*<\/div>\s*\)\)\}/;
const newRender = `{menuItems.map((section, idx) => {
          const isExpanded = expandedSection === idx;
          const isActiveSection = section.items.some(item => item.id === currentPage);
          
          return (
          <div key={idx} className="mb-2">
            {!collapsed ? (
              <button 
                onClick={() => setExpandedSection(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-johar-gray-mid mt-2 hover:text-johar-white transition-colors focus:outline-none"
              >
                <span>{section.section}</span>
                <svg className={\`w-4 h-4 transition-transform duration-200 \${isExpanded ? "rotate-90" : (isRTL ? "rotate-180" : "")}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="w-full border-b border-white/5 my-2"></div>
            )}
            
            <ul className={\`overflow-hidden transition-all duration-300 \${(isExpanded || collapsed || isActiveSection) ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}\`}>
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                    }}
                    className={\`sidebar-item w-full flex items-center px-4 py-3 \${currentPage === item.id ? "active bg-johar-gold/10 text-johar-gold border-l-2 border-johar-gold" : "text-johar-gray-light hover:bg-johar-black-lighter"}\`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{iconMap[item.icon]}</span>
                    {!collapsed && <span className={isRTL ? "mr-3" : "ml-3"}>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )})}
`;

code = code.replace(renderRegex, newRender);
fs.writeFileSync('src/components/Sidebar.tsx', code);
