import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Truck,
  Store,
  Package,
  CheckCircle,
  BarChart3,
  HelpCircle,
  Users,
  UserX
} from 'lucide-react';
import './Sidebar.css';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, to, isActive = false }) => {
  return (
    <li className="sidebar-nav-item">
      <Link 
        to={to} 
        className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
      >
        <span className="sidebar-nav-icon">{icon}</span>
        {label}
      </Link>
    </li>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', to: '/' },
    { icon: <Truck size={20} />, label: 'Couriers', to: '/couriers' },
    { icon: <Users size={20} />, label: 'Users', to: '/users' },
    { icon: <Store size={20} />, label: 'Vendors', to: '/vendors' },
    { icon: <UserX size={20} />, label: 'Suspended Users', to: '/suspended-users' },
    { icon: <Package size={20} />, label: 'Orders', to: '/orders' },
    { icon: <CheckCircle size={20} />, label: 'Verification', to: '/verification-requests' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', to: '/analytics' },
  ];

  const bottomMenuItems = [
    { icon: <HelpCircle size={20} />, label: 'Help', to: '/help' },
  ];

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/" className="sidebar-logo-content">
          <div className="sidebar-logo-icon">
            <span>B</span>
          </div>
          <span className="sidebar-logo-text">BESTIE</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {menuItems.map((item, index) => (
            <SidebarItem
              key={index}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to}
            />
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="sidebar-bottom">
        <ul className="sidebar-bottom-list">
          {bottomMenuItems.map((item, index) => (
            <SidebarItem
              key={index}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
