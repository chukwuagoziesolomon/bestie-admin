import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">Admin Dashboard</div>
        
        <div className="header-actions">
          <div className="user-profile-container">
            <div 
              className="user-profile"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="user-avatar">
                <span>AU</span>
              </div>
              <div className="user-info">
                <p className="user-name">Admin</p>
              </div>
            </div>
            
            {isDropdownOpen && (
              <div className="user-dropdown">
                <button 
                  className="dropdown-item" 
                  onClick={onLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
