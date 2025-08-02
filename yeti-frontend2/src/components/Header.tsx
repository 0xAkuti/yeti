'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  showNavigation?: boolean;
}

export function Header({ showNavigation = true }: HeaderProps) {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-[#006e4e]/30 bg-black/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="YETI Logo" 
              className="w-12 h-12 rounded-lg object-cover"
              style={{ width: '48px', height: '48px' }}
            />
            <Link href="/" className="text-xl font-black tracking-wider text-white uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              YETI
            </Link>
          </div>
          
          {showNavigation && (
            <>
              <nav className="hidden md:flex items-center space-x-8">
                <Link 
                  href="/app" 
                  className={`transition-colors ${
                    pathname === '/app' 
                      ? 'text-[#006e4e] font-medium' 
                      : 'text-white hover:text-[#006e4e]'
                  }`}
                >
                  Trade
                </Link>
                <Link 
                  href="/docs" 
                  className={`transition-colors ${
                    pathname === '/docs' 
                      ? 'text-[#006e4e] font-medium' 
                      : 'text-white hover:text-[#006e4e]'
                  }`}
                >
                  Docs
                </Link>
                <Link 
                  href="/app" 
                  className={`transition-colors ${
                    pathname === '/app' 
                      ? 'text-[#006e4e] font-medium' 
                      : 'text-white hover:text-[#006e4e]'
                  }`}
                >
                  Dashboard
                </Link>
              </nav>
              
              <Link 
                href="/app"
                className="bg-[#006e4e] hover:bg-[#005a42] text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
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