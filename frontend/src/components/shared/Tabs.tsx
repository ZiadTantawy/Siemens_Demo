/**
 * Tabs component using Headless UI
 */

import React, { Fragment } from 'react';
import { Tab } from '@headlessui/react';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
}

export const Tabs: React.FC<TabsProps> = ({ items, defaultIndex = 0, onChange }) => {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <Tab.List className="flex gap-2 border-b-2 border-white/10 pb-1 justify-center">
        {items.map((item) => (
          <Tab key={item.id} disabled={item.disabled} as={Fragment}>
            {({ selected }) => (
              <button
                className={`
                  flex items-center gap-3 px-6 py-4 text-base font-bold transition-all rounded-t-lg uppercase tracking-wider
                  ${
                    selected
                      ? 'border-b-4 border-white text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {item.icon && <span className={selected ? 'text-white' : 'text-white/60'}>{item.icon}</span>}
                {item.label}
              </button>
            )}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-8">
        {items.map((item) => (
          <Tab.Panel key={item.id} className="min-h-[500px]">{item.content}</Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

