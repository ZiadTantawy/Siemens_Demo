/**
 * Reports Attachment Tab
 */

import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Package, DollarSign, CheckSquare } from 'lucide-react';
import { useKnowledgeBase } from '../../../contexts/KnowledgeBaseContext';
import { AttachedContext } from '../../../types/chat';
import { getReportsByCategory } from '../../../services/mock/reportsMock';
import { ReportCategory } from '../../../types/shopify';

interface ReportsTabProps {
  selectedItems: AttachedContext[];
  onSelectionChange: (items: AttachedContext[]) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ selectedItems, onSelectionChange }) => {
  const { reports } = useKnowledgeBase();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all');

  const filteredReports = useMemo(() => {
    if (selectedCategory === 'all') return reports;
    return getReportsByCategory(reports, selectedCategory);
  }, [reports, selectedCategory]);

  const toggleSelection = (reportId: string, reportTitle: string) => {
    const itemId = `report_${reportId}`;
    const isSelected = selectedItems.some(item => item.id === itemId);

    if (isSelected) {
      onSelectionChange(selectedItems.filter(item => item.id !== itemId));
    } else {
      onSelectionChange([
        ...selectedItems,
        {
          id: itemId,
          type: 'report',
          sourceId: reportId,
          title: reportTitle
        }
      ]);
    }
  };

  const handleSelectAll = () => {
    const newSelections = filteredReports.map(report => ({
      id: `report_${report.id}`,
      type: 'report' as const,
      sourceId: report.id,
      title: report.title
    }));
    
    // Merge with existing selections, avoiding duplicates
    const existingIds = new Set(selectedItems.map(item => item.id));
    const uniqueNewSelections = newSelections.filter(item => !existingIds.has(item.id));
    
    onSelectionChange([...selectedItems, ...uniqueNewSelections]);
  };

  const allFilteredSelected = filteredReports.length > 0 && filteredReports.every(report => 
    selectedItems.some(item => item.id === `report_${report.id}`)
  );

  const categoryIcons: Record<ReportCategory, React.ReactNode> = {
    sales: <TrendingUp className="w-4 h-4" />,
    customer: <Users className="w-4 h-4" />,
    inventory: <Package className="w-4 h-4" />,
    financial: <DollarSign className="w-4 h-4" />
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-3 flex-wrap flex-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-3 text-base font-medium rounded-modern transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary/20 text-primary border-2 border-primary/30 shadow-lg'
                : 'bg-background/50 text-foreground/70 border-2 border-border/50 hover:border-primary/30 hover:bg-background/70'
            }`}
          >
            All Reports
          </button>
          {(['sales', 'customer', 'inventory', 'financial'] as ReportCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-3 text-base font-medium rounded-modern transition-all flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-primary/20 text-primary border-2 border-primary/30 shadow-lg'
                  : 'bg-background/50 text-foreground/70 border-2 border-border/50 hover:border-primary/30 hover:bg-background/70'
              }`}
            >
              {categoryIcons[category]}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        {selectedCategory !== 'all' && filteredReports.length > 0 && (
          <button
            onClick={handleSelectAll}
            disabled={allFilteredSelected}
            className={`px-5 py-3 border-2 rounded-modern text-base font-medium transition-all flex items-center gap-2 ${
              allFilteredSelected
                ? 'bg-background/30 border-border/50 text-foreground/50 cursor-not-allowed'
                : 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 hover:shadow-lg'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            Select All
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {filteredReports.length === 0 ? (
          <p className="text-center py-8 text-foreground/60">No reports found</p>
        ) : (
          filteredReports.map((report) => {
            const itemId = `report_${report.id}`;
            const isSelected = selectedItems.some(item => item.id === itemId);

              return (
                <label
                  key={report.id}
                  className={`flex items-center gap-4 p-5 border-2 rounded-modern cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary/30 shadow-lg'
                      : 'bg-background/30 border-border/50 hover:border-primary/30 hover:bg-background/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(report.id, report.title)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <BarChart3 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground mb-1">{report.title}</p>
                    {report.description && (
                      <p className="text-base text-foreground/70 truncate">{report.description}</p>
                    )}
                  </div>
                </label>
              );
          })
        )}
      </div>
    </div>
  );
};

export default ReportsTab;

