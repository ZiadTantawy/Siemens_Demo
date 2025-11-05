/**
 * Mock reports data generator
 */

import { Report, ReportCategory } from '../../types/shopify';
import { subDays, subMonths } from 'date-fns';

const SALES_REPORTS = [
  'Weekly Sales Summary',
  'Monthly Sales Performance',
  'Quarterly Revenue Report',
  'Year-over-Year Comparison',
  'Top Selling Products',
  'Sales by Channel',
  'Sales by Region',
  'Discount Impact Analysis'
];

const CUSTOMER_REPORTS = [
  'Customer Lifetime Value',
  'New vs Returning Customers',
  'Customer Acquisition Cost',
  'Customer Retention Rate',
  'Customer Segments Analysis',
  'Purchase Frequency Analysis'
];

const INVENTORY_REPORTS = [
  'Stock Levels Report',
  'Low Stock Alert',
  'Inventory Turnover',
  'Forecasting Report',
  'Dead Stock Analysis'
];

const FINANCIAL_REPORTS = [
  'Profit & Loss Statement',
  'Cash Flow Report',
  'Tax Summary',
  'Financial Overview'
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateReportData(category: ReportCategory): Record<string, any> {
  switch (category) {
    case 'sales':
      return {
        totalSales: randomFloat(10000, 100000),
        orderCount: randomInt(50, 500),
        averageOrderValue: randomFloat(50, 200),
        topProducts: Array.from({ length: 5 }, (_, i) => ({
          id: `product_${i}`,
          name: `Product ${i + 1}`,
          sales: randomFloat(1000, 10000),
          quantity: randomInt(10, 100)
        }))
      };
    case 'customer':
      return {
        totalCustomers: randomInt(100, 1000),
        newCustomers: randomInt(10, 100),
        returningCustomers: randomInt(50, 500),
        averageCLV: randomFloat(100, 500),
        segments: ['VIP', 'Regular', 'New'].map(segment => ({
          name: segment,
          count: randomInt(20, 200),
          averageSpend: randomFloat(50, 300)
        }))
      };
    case 'inventory':
      return {
        totalProducts: randomInt(100, 500),
        inStock: randomInt(50, 400),
        outOfStock: randomInt(0, 50),
        lowStock: randomInt(10, 100),
        totalValue: randomFloat(50000, 500000),
        turnoverRate: randomFloat(2, 12)
      };
    case 'financial':
      return {
        revenue: randomFloat(50000, 500000),
        expenses: randomFloat(20000, 200000),
        profit: randomFloat(10000, 300000),
        profitMargin: randomFloat(10, 40),
        cashFlow: randomFloat(-50000, 100000)
      };
    default:
      return {};
  }
}

export function generateMockReports(): Report[] {
  const reports: Report[] = [];
  const now = new Date();
  let reportId = 0;
  
  // Generate sales reports
  SALES_REPORTS.forEach(title => {
    const end = subDays(now, randomInt(0, 30));
    const start = subDays(end, randomInt(7, 90));
    
    reports.push({
      id: `report_${reportId++}`,
      title,
      category: 'sales',
      description: `Detailed sales analysis for ${title}`,
      generatedAt: end,
      dateRange: { start, end },
      data: generateReportData('sales'),
      format: 'json'
    });
  });
  
  // Generate customer reports
  CUSTOMER_REPORTS.forEach(title => {
    const end = subDays(now, randomInt(0, 30));
    const start = subDays(end, randomInt(30, 180));
    
    reports.push({
      id: `report_${reportId++}`,
      title,
      category: 'customer',
      description: `Customer insights for ${title}`,
      generatedAt: end,
      dateRange: { start, end },
      data: generateReportData('customer'),
      format: 'json'
    });
  });
  
  // Generate inventory reports
  INVENTORY_REPORTS.forEach(title => {
    const end = subDays(now, randomInt(0, 7));
    const start = subDays(end, randomInt(7, 30));
    
    reports.push({
      id: `report_${reportId++}`,
      title,
      category: 'inventory',
      description: `Inventory status for ${title}`,
      generatedAt: end,
      dateRange: { start, end },
      data: generateReportData('inventory'),
      format: 'json'
    });
  });
  
  // Generate financial reports
  FINANCIAL_REPORTS.forEach(title => {
    const end = subDays(now, randomInt(0, 30));
    const start = subMonths(end, randomInt(1, 12));
    
    reports.push({
      id: `report_${reportId++}`,
      title,
      category: 'financial',
      description: `Financial overview for ${title}`,
      generatedAt: end,
      dateRange: { start, end },
      data: generateReportData('financial'),
      format: 'json'
    });
  });
  
  return reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
}

export function getReportsByCategory(reports: Report[], category: ReportCategory): Report[] {
  return reports.filter(report => report.category === category);
}

export function generateDynamicReport(
  category: ReportCategory,
  start: Date,
  end: Date,
  title?: string
): Report {
  const defaultTitles: Record<ReportCategory, string[]> = {
    sales: SALES_REPORTS,
    customer: CUSTOMER_REPORTS,
    inventory: INVENTORY_REPORTS,
    financial: FINANCIAL_REPORTS
  };
  
  return {
    id: `report_dynamic_${Date.now()}`,
    title: title || randomElement(defaultTitles[category]),
    category,
    description: `Custom report generated for ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
    generatedAt: new Date(),
    dateRange: { start, end },
    data: generateReportData(category),
    format: 'json'
  };
}



