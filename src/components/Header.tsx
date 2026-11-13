import React, { useState } from 'react';
import { LogIn, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import type { User } from 'firebase/auth';

export type MainTab = 'home' | 'catalog' | 'sources' | 'gemini' | 'submission';

interface HeaderProps {
  activeTab: MainTab;
  onNavigate: (tab: MainTab) => void;
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

const NAV_ITEMS: Array<{ id: MainTab; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'catalog', label: 'Tư liệu' },
  { id: 'sources', label: 'Nguồn & Quyền' },
  { id: 'gemini', label: 'Trợ lý Gemini' },
  { id: 'submission', label: 'Hồ sơ & Nộp' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  user,
  isAdmin,
  authLoading,
  onSignIn,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab: MainTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#E3DDD2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-serif text-2xl font-semibold tracking-tight text-[#162436] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A7B3E]"
        >
          DiSanMeta
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7" aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`py-2 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#9A7B3E] text-[#162436]'
                    : 'border-transparent text-[#4B5B6E] hover:text-[#162436] hover:border-[#D5CCB8]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              disabled={authLoading}
              title={
                isAdmin
                  ? `Đã xác thực quản trị (${user.email}) — Nhấn để đăng xuất`
                  : `Tài khoản ${user.email} (chỉ xem) — Nhấn để đăng xuất`
              }
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#162436] text-[#FBF9F5] rounded-md hover:bg-[#233752] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-[#D8B979]" />}
              <span className="max-w-[140px] truncate">
                {isAdmin ? 'Quản trị' : user.displayName || user.email}
              </span>
              <LogOut className="w-3.5 h-3.5 opacity-80" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={authLoading}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#162436] text-[#FBF9F5] rounded-md hover:bg-[#233752] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5 text-[#D8B979]" />
              <span>Đăng nhập quản trị</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-[#E3DDD2] text-[#162436] hover:bg-[#F3EFE6] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3DDD2] bg-[#FBF9F5] px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-3 text-sm font-medium rounded-md flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-[#EFE9DC] text-[#162436]'
                    : 'text-[#4B5B6E] hover:bg-[#F3EFE6] hover:text-[#162436]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="text-xs text-[#9A7B3E]">Đang xem</span>}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#E3DDD2]">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-[#162436] text-[#FBF9F5] rounded-md cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>
                  Đăng xuất ({isAdmin ? 'Quản trị' : user.email})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-[#162436] text-[#FBF9F5] rounded-md cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#D8B979]" />
                <span>Đăng nhập quản trị</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
