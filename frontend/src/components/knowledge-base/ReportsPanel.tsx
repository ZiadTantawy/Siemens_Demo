/**
 * Reports Panel Component
 */

import React, { useState } from 'react';
import { BarChart3, Download, Plus, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { useKnowledgeBase } from '../../contexts/KnowledgeBaseContext';
import { useUI } from '../../contexts/UIContext';
import { Report, ReportCategory } from '../../types/shopify';
import { formatDate } from '../../utils/dateUtils';
import { Modal } from '../shared/Modal';
import { getReportsByCategory, generateDynamicReport } from '../../services/mock/reportsMock';

const ReportsPanel: React.FC = () => {
  const { reports, isLoadingReports } = useKnowledgeBase();
  const { showToast } = useUI();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const filteredReports = selectedCategory === 'all'
    ? reports
    : getReportsByCategory(reports, selectedCategory);

  const categories: Array<{ id: ReportCategory; label: string; icon: React.ReactNode; count: number }> = [
    { id: 'sales', label: 'Sales Performance', icon: <TrendingUp className="w-4 h-4" />, count: getReportsByCategory(reports, 'sales').length },
    { id: 'customer', label: 'Customer Insights', icon: <Users className="w-4 h-4" />, count: getReportsByCategory(reports, 'customer').length },
    { id: 'inventory', label: 'Inventory Status', icon: <Package className="w-4 h-4" />, count: getReportsByCategory(reports, 'inventory').length },
    { id: 'financial', label: 'Financial Summaries', icon: <DollarSign className="w-4 h-4" />, count: getReportsByCategory(reports, 'financial').length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-border/50">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Analytics Reports</h3>
          <p className="text-base text-foreground/70">
            <span className="font-semibold text-foreground">{reports.length}</span> available reports
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-primary-gradient text-white rounded-modern text-base font-semibold hover:shadow-neon transition-all"
        >
          <Plus className="w-5 h-5" />
          Generate New
        </button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-5 rounded-modern border-2 transition-all ${
              selectedCategory === category.id
                ? 'bg-primary/20 border-primary/30 text-primary shadow-lg'
                : 'bg-background/30 border-border/50 text-foreground hover:border-primary/30 hover:bg-background/40'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {category.icon}
              <span className="text-base font-bold">{category.label}</span>
            </div>
            <span className="text-sm text-foreground/70">{category.count} reports</span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {filteredReports.length === 0 ? (
          <div className="text-center py-8 text-foreground/60">
            <p>No reports found</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateReportModal onClose={() => setShowGenerateModal(false)} />
      )}
    </div>
  );
};

const ReportCard: React.FC<{ report: Report }> = ({ report }) => {
  const categoryIcons: Record<ReportCategory, React.ReactNode> = {
    sales: <TrendingUp className="w-5 h-5" />,
    customer: <Users className="w-5 h-5" />,
    inventory: <Package className="w-5 h-5" />,
    financial: <DollarSign className="w-5 h-5" />
  };

  return (
    <div className="p-5 bg-background/30 border-2 border-border/50 rounded-modern hover:border-primary/50 hover:bg-background/40 transition-all shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {categoryIcons[report.category]}
            <span className="text-lg font-bold text-foreground">{report.title}</span>
          </div>
          {report.description && (
            <p className="text-base text-foreground/70 mb-3">{report.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-foreground/60">
            <span>{formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}</span>
            <span>•</span>
            <span>Generated {formatDate(report.generatedAt)}</span>
          </div>
        </div>
        <button className="p-3 hover:bg-background/50 rounded-modern transition-colors border-2 border-border/50 hover:border-primary/50 flex-shrink-0">
          <Download className="w-5 h-5 text-foreground/60" />
        </button>
      </div>
    </div>
  );
};

const GenerateReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { showToast } = useUI();
  const [category, setCategory] = useState<ReportCategory>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      showToast('Please select date range', 'error');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      showToast('Start date must be before end date', 'error');
      return;
    }

    // Generate report
    const report = generateDynamicReport(category, start, end);
    showToast(`Report "${report.title}" generated successfully`, 'success');
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Generate New Report">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory)}
            className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-modern text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="sales">Sales Performance</option>
            <option value="customer">Customer Insights</option>
            <option value="inventory">Inventory Status</option>
            <option value="financial">Financial Summaries</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-modern text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-modern text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-primary-gradient text-white rounded-modern font-semibold hover:shadow-neon transition-all"
          >
            Generate Report
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportsPanel;

