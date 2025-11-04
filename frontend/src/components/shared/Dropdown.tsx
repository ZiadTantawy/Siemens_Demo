/**
 * Dropdown menu component using Headless UI
 */

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  button: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ button, items, align = 'right' }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>
        {button}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-10 mt-2 w-56 origin-top-right rounded-modern bg-card border border-border/50 shadow-glass backdrop-blur-glass focus:outline-none`}
        >
          <div className="p-1">
            {items.map((item, index) => (
              <div key={item.id}>
                {item.divider && index > 0 && (
                  <div className="my-1 border-t border-border/50" />
                )}
                <Menu.Item disabled={item.disabled}>
                  {({ active, disabled }) => (
                    <button
                      onClick={item.onClick}
                      disabled={disabled || item.disabled}
                      className={`${
                        active ? 'bg-primary/20 text-foreground' : 'text-foreground/70'
                      } ${
                        disabled || item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } group flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors`}
                    >
                      {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                      {item.label}
                    </button>
                  )}
                </Menu.Item>
              </div>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};


