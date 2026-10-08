const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// I will just rewrite it to be clean. I'll split by `const renderPage` and rebuild the end.
const splitParts = content.split('const renderPage = () => {');
const preRenderPage = splitParts[0];
const postRenderPage = splitParts[1];

// Find the end of renderPage function
const endOfRenderPageIdx = postRenderPage.indexOf('};');
const renderPageFunction = postRenderPage.substring(0, endOfRenderPageIdx + 2);

const correctLoadingBlock = `  if (loading) {
    return (
      <div className="min-h-screen bg-johar-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 gold-text animate-spin" />
      </div>
    );
  }`;

// Replace the bad loading block
const fixedPre = preRenderPage.replace(/if \(loading\) \{[\s\S]*?\}\s*\}\s*\)/m, correctLoadingBlock);

const newReturn = `
  return (
    <div className="flex h-screen overflow-hidden bg-johar-black" dir={isRTL ? "rtl" : "ltr"}>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with mobile toggle logic handled inside Sidebar or wrapper here */}
      <div className={\`fixed inset-y-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0 \${
        isRTL 
          ? (mobileMenuOpen ? "translate-x-0 right-0" : "translate-x-full right-0 lg:translate-x-0") 
          : (mobileMenuOpen ? "translate-x-0 left-0" : "-translate-x-full left-0 lg:translate-x-0")
      }\`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            setMobileMenuOpen(false); // Close on mobile navigation
          }}
        />
      </div>

      <main className="flex-1 overflow-auto flex flex-col h-screen w-full relative z-0">
        <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                className="lg:hidden p-2 text-johar-gray-light hover:text-white"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-black text-johar-gold">JOHAR</h1>
                <p className="hidden md:block text-xs text-johar-gray-light tracking-wide uppercase">
                  Global Gold & Jewelry Digital Infrastructure
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <select 
                className="bg-white/5 border border-white/10 rounded-lg text-sm p-1.5 md:p-2 text-white outline-none focus:border-johar-gold"
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>

              <button className="relative p-2 text-johar-gray-light hover:text-white hidden sm:block">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-johar-gold to-yellow-300 flex items-center justify-center text-black text-sm font-bold shadow-md">
                  A
                </div>
                <div className="hidden sm:block text-sm">
                  <p className="font-bold">{t('super_admin')}</p>
                </div>
              </div>

              <button onClick={signOut} className="btn-secondary text-sm flex items-center gap-2 px-3 py-1.5">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 pb-24">{renderPage()}</div>
      </main>
    </div>
  );
}
`;

// Oh wait, the imports at the top are missing `Menu`? I did add it earlier. Let's make sure.
let finalFile = fixedPre + 'const renderPage = () => {' + renderPageFunction + newReturn;
if (!finalFile.includes('Menu,')) {
    finalFile = finalFile.replace('LogOut, Gem', 'LogOut, Gem, Menu, X');
}

fs.writeFileSync('src/App.tsx', finalFile);
