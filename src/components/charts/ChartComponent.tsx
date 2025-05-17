'use client';

import { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  LineController,
  BarController,
  PieController,
  DoughnutController
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Box, Spinner, Center } from '@chakra-ui/react';

// Registra os componentes necessários do Chart.js
// Este registro é executado apenas no lado do cliente
const registerChartComponents = () => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    // Registrando os controllers explicitamente
    LineController,
    BarController,
    PieController,
    DoughnutController
  );
};

interface ChartComponentProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: any;
  options?: any;
  height?: number | string;
}

export function ChartComponent({ type, data, options, height = '100%' }: ChartComponentProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Registra os componentes do Chart.js quando o componente é montado no cliente
    registerChartComponents();
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Center h={height}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box height={height}>
      <Chart type={type} data={data} options={options} />
    </Box>
  );
}
