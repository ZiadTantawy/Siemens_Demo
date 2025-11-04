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
      <Tab.List className="flex gap-2 border-b-2 border-border/50 pb-1">
        {items.map((item) => (
          <Tab key={item.id} disabled={item.disabled} as={Fragment}>
            {({ selected }) => (
              <button
                className={`
                  flex items-center gap-3 px-6 py-4 text-base font-semibold transition-all rounded-t-lg
                  ${
                    selected
                      ? 'border-b-4 border-primary text-primary bg-primary/10'
                      : 'text-foreground/60 hover:text-foreground hover:bg-background/30'
                  }
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {item.icon && <span>{item.icon}</span>}
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

