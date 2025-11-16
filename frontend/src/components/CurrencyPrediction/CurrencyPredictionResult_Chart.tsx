import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Spinner, Text, VStack,HStack, Table, Center, Heading } from '@chakra-ui/react';
import Chart from "react-apexcharts";
import CurrencyActualData from './CurrencyActualData';
import CurrencyActualPredictedData from './CurrencyActualPredictedData';

interface Prediction {
  date: string;
  formatted: string;
  change: number;
  confidence: number;
  open: number;
  high: number;
  low: number;
  close: number;
  price_range: number;
}

interface PredictionResponse {
  prediction: Prediction[];
  summary: {
    last_open: number;
    last_high: number;
    last_low: number;
    last_close: number;
    avg_predicted_close: number
    high_predicted: number
    low_predicted: number
    avg_range: number
    interval: string;
    symbol: string;
  };
  message: string;
}
interface FxActualPredictedDataProps {
  interval: '15min'| '30min'| '45min' | '1h'| '4h'|'1day' | '1week';
  symbol: 'EURUSD=X' | 'JPY=X' | 'GBPUSD=X';
}
const CurrencyPredictionResult_Chart: React.FC<FxActualPredictedDataProps> = ({interval, symbol}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [summary, setSummary] = useState<PredictionResponse['summary'] | null>(null);
  const [series, setSeries] = useState<any[]>([]);

  
const handlePredict = async () => {
  setLoading(true);
  setError(null);
  setPredictions(null);

  const url = 'http://localhost:8000/api/currency/prediction-results/';

  try {
    const response = await axios.post<any>(url, { interval:interval, symbol:symbol}, {
      headers: { 'Content-Type': 'application/json' },
    });

    const data = response.data;
    const preds = data.predictions;
    console.log("predicted chart data - currency: ", preds)

    if (preds && Array.isArray(preds) && preds.length > 0) {
      setPredictions({
        prediction: preds,  // ← assign to singular for UI
        summary: data.summary,
        message: data.message || 'Prediction successful!'
      });
    } else {
      throw new Error('Invalid prediction data: predictions array missing or empty');
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Unknown error';
    setError(msg);
    console.error('Prediction error:', err);
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await Promise.all([handlePredict()]);
      } finally {
        setLoading(false);
      }
    };

    run();                                   // immediate
    const timer = setInterval(run, 3_600_000); // hourly

    return () => clearInterval(timer);
  }, [interval, symbol]);


useEffect(() => {
    if (!predictions?.prediction?.length) return;

    const predictedCandleData = predictions.prediction.map((p) => ({
      x: new Date(p.date),
      y: [p.open, p.high, p.low, p.close],
    }));

    // const predictedCloseLine = predictions.prediction.map((p) => ({
    //   x: new Date(p.date).getTime(),
    //   y: p.close,
    // }));

    setSeries([
      {
        name: "Predicted OHLC",
        type: "candlestick",
        data: predictedCandleData,
      },
    ]);
  }, [predictions]);

  const options: any = {
    chart: {
      type: "candlestick",
      height: 500,
      toolbar: { show: true },
      zoom: { enabled: false },
    },
    title: {
      text: `${symbol} - Predicted OHLC - interval ${interval}`,
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: "bold",
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        datetimeUTC: false,
        rotate: -45,
        datetimeFormatter: {
          year: "yyyy",
          month: "MMM",
          day: "dd MMM yyyy",
          hour: "dd MMM yyyy HH:mm",
        },
      },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { formatter: (val: number) => val.toFixed(4) }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#00B746",
          downward: "#EF403C",
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    tooltip: {
      shared: false,
      x: { format: "yyyy-MM-dd HH:mm" },
      custom: function ({ seriesIndex, dataPointIndex, w }: any) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        
        if (data.y && Array.isArray(data.y)) {
          const [open, high, low, close] = data.y;
          const change = close - open;
          const changePercent = ((change / open) * 100).toFixed(4);
          
          return `
            <div style="padding: 10px; background: rgba(0,0,0,0.85); color: white; border-radius: 6px;">
              <div style="font-weight: bold; margin-bottom: 8px;">
                ${w.globals.seriesNames[seriesIndex]}
              </div>
              <div><strong>Open:</strong> $${open.toFixed(4)}</div>
              <div><strong>High:</strong> <span style="color: #00B746;">$${high.toFixed(4)}</span></div>
              <div><strong>Low:</strong> <span style="color: #EF403C;">$${low.toFixed(4)}</span></div>
              <div><strong>Close:</strong> $${close.toFixed(4)}</div>
              <div style="margin-top: 4px; color: ${change >= 0 ? '#00B746' : '#EF403C'};">
                <strong>Change:</strong> ${change >= 0 ? '+' : ''}$${change.toFixed(4)} (${changePercent}%)
              </div>
            </div>
          `;
        }
        return "";
      },
    },
    stroke: {
      width: [1, 1, 2],
    },
    colors: ["#008FFB", "#FEB019", "#775DD0"],
  };


  return (
    <Box w={"100%"} maxW="100%" my={"20px"}>
      <VStack gap={"10px"} align="stretch">
        <Button
          onClick={handlePredict}
          colorScheme="blue"
          size="lg"
        >
          Run Prediction ({interval})
        </Button>
        {error && (
          <Box color="red.600" p={3} bg="red.50" borderRadius="md">
            {error}
          </Box>
        )}
        {loading && (
          <Box textAlign="center">
            <Spinner size="xl" />
            <Text mt={2}>Predicting...</Text>
          </Box>
        )}
          {predictions && !loading && (
          <Box>
            <Box my={"10px"}>
              {series.length > 0 && !loading && (
                <Box rounded={"7px"} border={"1px solid"} w={"100%"}>
                  <Chart options={options} series={series} type="candlestick" height={500}/>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default CurrencyPredictionResult_Chart;
