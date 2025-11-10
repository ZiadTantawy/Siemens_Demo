import React from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  type: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  data: any[];
  dataKey: string;
  xKey?: string;
  colors?: string[];
}

interface MarketingChartProps {
  chart: ChartData;
}

const COLORS = ['#ffffff', '#f0f0f0', '#d0d0d0', '#b0b0b0', '#909090'];

const MarketingChart: React.FC<MarketingChartProps> = ({ chart }) => {
  const { type, title, data, dataKey, xKey = 'name', colors = COLORS } = chart;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey={xKey} stroke="#ffffff80" tick={{ fill: '#ffffff' }} />
            <YAxis stroke="#ffffff80" tick={{ fill: '#ffffff' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff30', borderRadius: '8px', color: '#ffffff' }}
              labelStyle={{ color: '#ffffff' }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Bar dataKey={dataKey} fill="#ffffff" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey={xKey} stroke="#ffffff80" tick={{ fill: '#ffffff' }} />
            <YAxis stroke="#ffffff80" tick={{ fill: '#ffffff' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff30', borderRadius: '8px', color: '#ffffff' }}
              labelStyle={{ color: '#ffffff' }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Line type="monotone" dataKey={dataKey} stroke="#ffffff" strokeWidth={2} dot={{ fill: '#ffffff', r: 4 }} />
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey={xKey} stroke="#ffffff80" tick={{ fill: '#ffffff' }} />
            <YAxis stroke="#ffffff80" tick={{ fill: '#ffffff' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff30', borderRadius: '8px', color: '#ffffff' }}
              labelStyle={{ color: '#ffffff' }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Area type="monotone" dataKey={dataKey} stroke="#ffffff" fill="#ffffff30" />
          </AreaChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff30', borderRadius: '8px', color: '#ffffff' }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
          </PieChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="my-6 p-4 bg-white/5 rounded-lg border border-white/20">
      <h4 className="text-lg font-bold text-white mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default MarketingChart;

