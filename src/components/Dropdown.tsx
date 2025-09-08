import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import './Dropdown.css';

interface DropdownItem {
  label: string;
  onClick: () => void;
  className?: string;
}

interface DropdownProps {
  items: DropdownItem[];
  title?: string;
  position?: 'left' | 'right';
}

const Dropdown: React.FC<DropdownProps> = ({ items, title = "Status", position = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: DropdownItem) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button className="dropdown-trigger" onClick={handleToggle}>
        <MoreVertical size={16} />
      </button>
      
      {isOpen && (
        <div className={`dropdown-menu ${position === 'left' ? 'dropdown-menu-left' : 'dropdown-menu-right'}`}>
          <div className="dropdown-header">
            {title}
          </div>
          <div className="dropdown-content">
            {items.map((item, index) => (
              <button
                key={index}
                className={`dropdown-item ${item.className || ''}`}
                onClick={() => handleItemClick(item)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
