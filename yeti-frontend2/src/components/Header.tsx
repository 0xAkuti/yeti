'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  showNavigation?: boolean;
}

export function Header({ showNavigation = true }: HeaderProps) {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-[#006e4e]/30 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="YETI Logo" 
              className="w-12 h-12 rounded-lg object-cover shadow-lg"
              style={{ width: '48px', height: '48px' }}
            />
            <Link href="/" className="text-xl font-black tracking-wider text-white uppercase hover:text-[#00ff88] transition-colors duration-200" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              YETI
            </Link>
          </div>
          
          {showNavigation && (
            <>
              <nav className="hidden md:flex items-center space-x-8">
                <Link 
                  href="/app" 
                  className={`transition-all duration-200 font-medium ${
                    pathname === '/app' 
                      ? 'text-[#00ff88] font-semibold drop-shadow-[0_0_8px_#00ff88]' 
                      : 'text-white hover:text-[#00ff88] hover:drop-shadow-[0_0_4px_#00ff88]'
                  }`}
                >
                  Trade
                </Link>
                <Link 
                  href="/docs" 
                  className={`transition-all duration-200 font-medium ${
                    pathname === '/docs' 
                      ? 'text-[#00ff88] font-semibold drop-shadow-[0_0_8px_#00ff88]' 
                      : 'text-white hover:text-[#00ff88] hover:drop-shadow-[0_0_4px_#00ff88]'
                  }`}
                >
                  Docs
                </Link>
              </nav>
              
              <Link 
                href="/app"
                className="bg-gradient-to-r from-[#006e4e] to-[#008f6a] hover:from-[#005a42] hover:to-[#007055] text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Launch App
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}