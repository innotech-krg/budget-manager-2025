// =====================================================
// Budget Manager 2025 - Burn Rate Chart
// Story 1.5: Echtzeit-Budget-Dashboard - Burn-Rate-Visualisierung
// =====================================================

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Chart.js registrieren
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BurnRateData {
  monthlyData: Array<{
    month: string;
    date: string;
    budgetConsumed: number;
    budgetConsumedFormatted: string;
    budgetAllocated: number;
    budgetAllocatedFormatted: string;
    utilizationRate: number;
  }>;
  projectedData: Array<{
    month: string;
    date: string;
    budgetConsumed: number;
    budgetConsumedFormatted: string;
    isProjected: boolean;
  }>;
  trend: {
    direction: 'INCREASING' | 'DECREASING' | 'STABLE';
    percentage: number;
    label: string;
  };
  averageMonthlyBurn: {
    amount: number;
    formatted: string;
  };
  currentMonthBurn: {
    amount: number;
    formatted: string;
  };
}

interface BurnRateChartProps {
  data: BurnRateData;
  isLoading?: boolean;
  height?: number;
}

const BurnRateChart: React.FC<BurnRateChartProps> = ({
  data,
  isLoading = false,
  height = 400
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className={`bg-gray-200 rounded`} style={{ height: `${height}px` }}></div>
        </div>
      </div>
    );
  }

  // Kombiniere historische und projizierte Daten
  const allMonths = [
    ...data.monthlyData.map(d => d.month),
    ...data.projectedData.map(d => d.month)
  ];

  const historicalConsumption = [
    ...data.monthlyData.map(d => d.budgetConsumed),
    ...Array(data.projectedData.length).fill(null)
  ];

  const projectedConsumption = [
    ...Array(data.monthlyData.length - 1).fill(null),
    data.monthlyData[data.monthlyData.length - 1]?.budgetConsumed || 0,
    ...data.projectedData.map(d => d.budgetConsumed)
  ];

  const allocatedBudget = [
    ...data.monthlyData.map(d => d.budgetAllocated),
    ...Array(data.projectedData.length).fill(null)
  ];

  const chartData = {
    labels: allMonths,
    datasets: [
      {
        label: 'Verbrauchtes Budget',
        data: historicalConsumption,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        label: 'Zugewiesenes Budget',
        data: allocatedBudget,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Prognose',
        data: projectedConsumption,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        borderDash: [10, 5],
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(168, 85, 247)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            if (value === null) return null;
            
            const formattedValue = new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            }).format(value);
            
            return `${context.dataset.label}: ${formattedValue}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'INCREASING': return '📈';
      case 'DECREASING': return '📉';
      case 'STABLE': return '➡️';
      default: return '📊';
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'INCREASING': return 'text-red-600 bg-red-100';
      case 'DECREASING': return 'text-green-600 bg-green-100';
      case 'STABLE': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">📈</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Burn-Rate-Analyse</h3>
            <p className="text-sm text-gray-500">
              Monatlicher Budget-Verbrauch mit Trend-Prognose
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(data.trend.direction)}`}>
          <span className="mr-1">{getTrendIcon(data.trend.direction)}</span>
          {data.trend.label} ({data.trend.percentage.toFixed(1)}%)
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Durchschnittlicher monatlicher Verbrauch</p>
          <p className="text-xl font-bold text-gray-900">{data.averageMonthlyBurn.formatted}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Aktueller Monats-Verbrauch</p>
          <p className="text-xl font-bold text-gray-900">{data.currentMonthBurn.formatted}</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Legende */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Historische Daten (durchgezogene Linie) • Prognose (gestrichelte Linie)</p>
      </div>
    </div>
  );
};

export default BurnRateChart;

