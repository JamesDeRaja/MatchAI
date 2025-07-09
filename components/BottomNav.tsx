import React from 'react';
import { Page, useAppContext } from '../context/AppContext';

const NavItem: React.FC<{
  page: Page;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  showNotificationDot?: boolean;
  notificationCount?: number;
}> = ({ page, label, icon, disabled = false, showNotificationDot = false, notificationCount = 0 }) => {
  const { activePage, setActivePage } = useAppContext();
  const isActive = activePage === page;

  const colorClass = isActive
    ? 'text-rose-500 dark:text-rose-400'
    : 'text-gray-500 dark:text-gray-400';
  
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800';

  const handleClick = () => {
    if (!disabled) {
      setActivePage(page);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${disabledClass}`}
    >
      <div className="relative">
        <div className={`transition-transform transform ${isActive ? 'scale-110' : ''} ${colorClass}`}>
          {icon}
        </div>
        {showNotificationDot && !disabled && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-black"></span>
        )}
        {notificationCount > 0 && !disabled && (
          <span className="absolute top-[-4px] right-[-8px] flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white ring-2 ring-white dark:ring-black">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </div>
      <span className={`text-xs mt-1 ${colorClass}`}>{label}</span>
      {isActive && <div className="h-1 w-8 bg-rose-500 dark:bg-rose-400 rounded-full mt-1"></div>}
    </button>
  );
};

const BottomNav: React.FC = () => {
  const { user, showExploreTabNotification, totalUnreadCount } = useAppContext();
  const isOnboardingCompleted = user?.onboardingCompleted ?? false;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto h-16 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 flex justify-around items-center">
      <NavItem
        page={Page.AI_CHAT}
        label="AI Chat"
        icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a6 6 0 0 0 6-6V9a6 6 0 0 0-6-6h0a6 6 0 0 0-6 6v7a6 6 0 0 0 6 6Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 12h.01"/></svg>
        }
      />
      <NavItem
        page={Page.EXPLORE}
        label="Explore"
        icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/><path d="m11.645 20.91-1.112-1.016C4.872 14.624 2 11.536 2 8.019 2 4.904 4.496 2.5 7.5 2.5c1.808 0 3.504.856 4.5 2.15C13.008 3.352 14.688 2.5 16.5 2.5c3.008 0 5.5 2.404 5.5 5.519 0 3.517-2.872 6.605-8.533 11.875L12.355 20.91a.5.5 0 0 1-.71 0Z"/></svg>
        }
        disabled={!isOnboardingCompleted}
        showNotificationDot={showExploreTabNotification}
      />
      <NavItem
        page={Page.CHAT}
        label="Chat"
        icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18.1H3"/></svg>
        }
        disabled={!isOnboardingCompleted}
        notificationCount={totalUnreadCount}
      />
      <NavItem
        page={Page.SETTINGS}
        label="Settings"
        icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        }
      />
    </nav>
  );
};

export default BottomNav;