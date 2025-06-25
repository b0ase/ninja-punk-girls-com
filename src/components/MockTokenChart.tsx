'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Import Filler for area below line
  TimeScale, // Import TimeScale if using time-based labels
} from 'chart.js';
// Import date adapter if using TimeScale (optional, depends on labels)
// import 'chartjs-adapter-date-fns'; 

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Register Filler
  TimeScale // Register TimeScale
);

// Define Props Interface
interface MockTokenChartProps {
  tokenId: string; // Accept the token ID, even if not used yet by mock data
}

// Function to generate mock price data
const generateMockData = (numPoints = 30) => {
  const labels: string[] = [];
  const data: number[] = [];
  let price = 100; // Starting price
  const trend = 0.5; // Slight upward trend factor
  const volatility = 10; // How much the price fluctuates

  for (let i = 0; i < numPoints; i++) {
    labels.push(`-${numPoints - i -1}h`); // Simple labels like "-29h", "-28h", ..., "-0h"
    price += trend + (Math.random() - 0.5) * volatility;
    price = Math.max(10, price); // Ensure price doesn't go too low
    data.push(parseFloat(price.toFixed(4))); // Store price with 4 decimal places
  }
  labels[numPoints - 1] = 'Now'; // Change last label
  return { labels, data };
};

export default function MockTokenChart({ tokenId }: MockTokenChartProps) {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({ labels: [], datasets: [] });

  useEffect(() => {
    const { labels, data } = generateMockData(30);
    setChartData({
      labels,
      datasets: [
        {
          label: '$NPG Price (Mock)',
          data: data,
          fill: true, // Enable fill
          borderColor: 'rgb(236, 72, 153)', // Pink color (Tailwind pink-500)
          backgroundColor: 'rgba(236, 72, 153, 0.1)', // Lighter pink fill
          tension: 0.3, // Make the line curved
          pointRadius: 2, // Smaller points
          pointBackgroundColor: 'rgb(236, 72, 153)',
        },
      ],
    });
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
            color: '#cbd5e1' // Tailwind slate-300
        }
      },
      title: {
        display: false, // No main title needed within component
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#e5e7eb', // Tailwind gray-200
        bodyColor: '#cbd5e1', // Tailwind slate-300
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Lighter grid lines
        },
        ticks: {
          color: '#94a3b8', // Tailwind slate-400
           maxTicksLimit: 8 // Limit number of x-axis labels shown
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
          // Consider adding a callback to format ticks as currency/sats if needed
          // callback: function(value: number | string) {
          //    return '$' + value; 
          // }
        },
      },
    },
    interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
    },
    // Add hover effect configuration if desired
    // onHover: (event, chartElement) => { ... }
  };

  return (
    <div className="relative h-64 md:h-80"> {/* Set height for the chart container */}
      <Line options={options} data={chartData} />
    </div>
  );
} 