import {useEffect, useState} from 'react'
import {Box, Text, Spinner, Grid} from '@chakra-ui/react'
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ActualPrice {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

interface OHLCPrediction {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface GoleIntervalProp {
    interval: '15m'| '30m'| '45m' | '1h'| '4h'|'1d' | '1wk';
}

const PriceDeviation: React.FC<GoleIntervalProp> = ({interval}) => {

    const [actualPrice, setActualPrice] = useState<ActualPrice[]>([]);
    const [predictedData, setPredictedData] = useState<OHLCPrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toISO = (dateStr: string): string =>
      dateStr.includes("T") ? dateStr.trim() : dateStr.trim().replace(" ", "T");

    const fetch_actual_price = async () => {
    try {
      const { data } = await axios.post(
        "http://127.0.0.1:8000/api/fxprediction/actual-prices/",
        { interval, },
        { headers: { "Content-Type": "application/json" } }
      );

      const raw = data.data;

      if (!Array.isArray(raw) || raw.length === 0) {
        setActualPrice([]);
        return;
      }

      const valid: ActualPrice[] = raw
        .map((row: any) => ({
          Date: toISO(String(row.Date)),
          Open: Number(row.Open),
          High: Number(row.High),
          Low: Number(row.Low),
          Close: Number(row.Close),
        }))
        .filter((d): d is ActualPrice => {
          const ts = new Date(d.Date).getTime();
          return !isNaN(ts) && !isNaN(d.Open) && !isNaN(d.High) && !isNaN(d.Low) && !isNaN(d.Close);
        })
        // Sort by date ascending (oldest first)
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

      setActualPrice(valid);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Unknown error";
      setError(`Failed to load actual prices: ${msg}`);
    }
  };

  const fetch_predicted_prices = async () => {
    const url = `http://127.0.0.1:8000/api/fxprediction/predicted-prices-${interval}/`;
    try {
      const { data } = await axios.get(url);

      const normalized = (data ?? [])
        .map((p: any) => ({
          date: toISO(p.date),
          open: Number(p.open),
          high: Number(p.high),
          low: Number(p.low),
          close: Number(p.close),
        }))
        // Sort by date ascending (oldest first)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setPredictedData(normalized);
    } catch (err: any) {
      setError("Failed to load predictions");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await fetch_actual_price();
      await fetch_predicted_prices();
      setLoading(false);
    };
    loadData();
  }, [interval]);

  const deviationFunction = (field: "Open" | "High" | "Low" | "Close") => {
    const pKey = field.toLowerCase() as keyof OHLCPrediction;

    const predictedMap = new Map(
      predictedData.map(d => [new Date(d.date).getTime(), d[pKey] as number])
    );

    const deviations = actualPrice
      .map(actual => {
        const timestamp = new Date(actual.Date).getTime();
        const predictedValue = predictedMap.get(timestamp);
        
        if (predictedValue !== undefined && !isNaN(actual[field]) && !isNaN(predictedValue)) {
          return {
            date: actual.Date,
            timestamp: timestamp, // Add timestamp for sorting
            field: field,
            actual: actual[field],
            predicted: predictedValue,
            deviation: actual[field] - predictedValue,
            deviationPercent: ((actual[field] - predictedValue) / actual[field]) * 100
          };
        }
        return null;
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      // Sort by timestamp to ensure chronological order
      .sort((a, b) => a.timestamp - b.timestamp);

    return deviations;
  };

  const openDeviations = deviationFunction("Open");
  const highDeviations = deviationFunction("High");
  const lowDeviations = deviationFunction("Low");
  const closeDeviations = deviationFunction("Close");

  // Prepare chart data for each field - now properly sorted
  const prepareChartData = (deviations: ReturnType<typeof deviationFunction>, limit = 20) => {
    // Get the last 'limit' items (most recent dates)
    const recentData = deviations.slice(-limit);
    
    return recentData.map(dev => ({
      date: new Date(dev.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: dev.date.includes('T') ? '2-digit' : undefined,
        minute: dev.date.includes('T') ? '2-digit' : undefined
      }),
      fullDate: dev.date, // Keep full date for debugging
      deviation: Math.abs(dev.deviation),
      rawDeviation: dev.deviation,
      actual: dev.actual,
      predicted: dev.predicted,
    }));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} border="1px solid #ccc" borderRadius="md" shadow="md">
          <Text fontSize="sm" fontWeight="bold">{data.date}</Text>
          <Text fontSize="xs" color="gray.600">{data.fullDate}</Text>
          <Text fontSize="sm">Actual: {data.actual.toFixed(5)}</Text>
          <Text fontSize="sm">Predicted: {data.predicted.toFixed(5)}</Text>
          <Text fontSize="sm" fontWeight="bold" color={data.rawDeviation >= 0 ? "green.600" : "red.600"}>
            Deviation: {data.rawDeviation.toFixed(5)}
          </Text>
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="xl" />
        <Text mt={2}>Loading data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  const openChartData = prepareChartData(openDeviations);
  const highChartData = prepareChartData(highDeviations);
  const lowChartData = prepareChartData(lowDeviations);
  const closeChartData = prepareChartData(closeDeviations);

  return (
    <Box p={4}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        Price Deviation Analysis ({interval})
      </Text>

      {/* Summary Statistics */}
      <Box p={4} bg="blue.50" borderRadius="md" mb={6}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>Summary</Text>
        <Grid templateColumns="repeat(4, 1fr)" gap={4}>
          <Box>
            <Text fontWeight="semibold">Open: {openDeviations.length} matches</Text>
            {openDeviations.length > 0 && (
              <Text fontSize="xs" color="gray.600">
                Latest: {new Date(openDeviations[openDeviations.length - 1].date).toLocaleString()}
              </Text>
            )}
          </Box>
          <Box>
            <Text fontWeight="semibold">High: {highDeviations.length} matches</Text>
            {highDeviations.length > 0 && (
              <Text fontSize="xs" color="gray.600">
                Latest: {new Date(highDeviations[highDeviations.length - 1].date).toLocaleString()}
              </Text>
            )}
          </Box>
          <Box>
            <Text fontWeight="semibold">Low: {lowDeviations.length} matches</Text>
            {lowDeviations.length > 0 && (
              <Text fontSize="xs" color="gray.600">
                Latest: {new Date(lowDeviations[lowDeviations.length - 1].date).toLocaleString()}
              </Text>
            )}
          </Box>
          <Box>
            <Text fontWeight="semibold">Close: {closeDeviations.length} matches</Text>
            {closeDeviations.length > 0 && (
              <Text fontSize="xs" color="gray.600">
                Latest: {new Date(closeDeviations[closeDeviations.length - 1].date).toLocaleString()}
              </Text>
            )}
          </Box>
        </Grid>
      </Box>

      
      {/* Close Deviations Chart */}
      <Box mb={6} p={4} borderWidth={1} borderRadius="md">
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Close Price Deviations (Last 20)
        </Text>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={closeChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              fontSize={11}
            />
            <YAxis fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="deviation" fill="#8884d8" name="Absolute Deviation">
              {closeChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.rawDeviation >= 0 ? "#82ca9d" : "#ff7979"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {/* High Deviations Chart */}
      <Box mb={6} p={4} borderWidth={1} borderRadius="md">
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          High Price Deviations (Last 20)
        </Text>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={highChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              fontSize={11}
            />
            <YAxis fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="deviation" fill="#8884d8" name="Absolute Deviation">
              {highChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.rawDeviation >= 0 ? "#82ca9d" : "#ff7979"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {/* Low Deviations Chart */}
      <Box mb={6} p={4} borderWidth={1} borderRadius="md">
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Low Price Deviations (Last 20)
        </Text>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lowChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              fontSize={11}
            />
            <YAxis fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="deviation" fill="#8884d8" name="Absolute Deviation">
              {lowChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.rawDeviation >= 0 ? "#82ca9d" : "#ff7979"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {/* Open Deviations Chart */}
      <Box mb={6} p={4} borderWidth={1} borderRadius="md">
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Open Price Deviations (Last 20)
        </Text>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={openChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              fontSize={11}
            />
            <YAxis fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="deviation" fill="#8884d8" name="Absolute Deviation">
              {openChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.rawDeviation >= 0 ? "#82ca9d" : "#ff7979"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

    </Box>
  );
}

export default PriceDeviation;

// import {useEffect, useState} from 'react'
// import {Box, Text, Spinner} from '@chakra-ui/react'
// import axios from 'axios';

// interface ActualPrice {
//   Date: string;
//   Open: number;
//   High: number;
//   Low: number;
//   Close: number;
// }

// interface OHLCPrediction {
//   date: string;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
// }

// interface GoleIntervalProp {
//     interval: '15m'| '30m'| '45m' | '1h'| '4h'|'1d' | '1wk';
// }

// const PriceDeviation: React.FC<GoleIntervalProp> = ({interval}) => {

//     const [actualPrice, setActualPrice] = useState<ActualPrice[]>([]);
//     const [predictedData, setPredictedData] = useState<OHLCPrediction[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const toISO = (dateStr: string): string =>
//       dateStr.includes("T") ? dateStr.trim() : dateStr.trim().replace(" ", "T");

//     const fetch_actual_price = async () => {
//     try {
//       const { data } = await axios.post(
//         "http://127.0.0.1:8000/api/fxprediction/actual-prices/",
//         { interval, },
//         { headers: { "Content-Type": "application/json" } }
//       );

//       const raw = data.data;

//       if (!Array.isArray(raw) || raw.length === 0) {
//         setActualPrice([]);
//         return;
//       }

//       const valid: ActualPrice[] = raw
//         .map((row: any) => ({
//           Date: toISO(String(row.Date)),
//           Open: Number(row.Open),
//           High: Number(row.High),
//           Low: Number(row.Low),
//           Close: Number(row.Close),
//         }))
//         .filter((d): d is ActualPrice => {
//           const ts = new Date(d.Date).getTime();
//           return !isNaN(ts) && !isNaN(d.Open) && !isNaN(d.High) && !isNaN(d.Low) && !isNaN(d.Close);
//         });

//       setActualPrice(valid);
//     } catch (err: any) {
//       const msg = err.response?.data?.error || err.message || "Unknown error";
//       setError(`Failed to load actual prices: ${msg}`);
//     }
//   };

//   const fetch_predicted_prices = async () => {
//     const url = `http://127.0.0.1:8000/api/fxprediction/predicted-prices-${interval}/`;
//     try {
//       const { data } = await axios.get(url);

//       const normalized = (data ?? []).map((p: any) => ({
//         date: toISO(p.date),
//         open: Number(p.open),
//         high: Number(p.high),
//         low: Number(p.low),
//         close: Number(p.close),
//       }));

//       setPredictedData(normalized);
//     } catch (err: any) {
//       setError("Failed to load predictions");
//     }
//   };

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       setError(null);
//       await fetch_actual_price();
//       await fetch_predicted_prices();
//       setLoading(false);
//     };
//     loadData();
//   }, [interval]);

//   const deviationFunction = (field: "Open" | "High" | "Low" | "Close") => {
//     const pKey = field.toLowerCase() as keyof OHLCPrediction;

//     const predictedMap = new Map(
//       predictedData.map(d => [new Date(d.date).getTime(), d[pKey] as number])
//     );

//     const deviations = actualPrice
//       .map(actual => {
//         const timestamp = new Date(actual.Date).getTime();
//         const predictedValue = predictedMap.get(timestamp);
        
//         if (predictedValue !== undefined && !isNaN(actual[field]) && !isNaN(predictedValue)) {
//           return {
//             date: actual.Date,
//             field: field,
//             actual: actual[field],
//             predicted: predictedValue,
//             deviation: actual[field] - predictedValue,
//             deviationPercent: ((actual[field] - predictedValue) / actual[field]) * 100
//           };
//         }
//         return null;
//       })
//       .filter((d): d is NonNullable<typeof d> => d !== null);

//     return deviations;
//   };

//   const openDeviations = deviationFunction("Open");
//   const highDeviations = deviationFunction("High");
//   const lowDeviations = deviationFunction("Low");
//   const closeDeviations = deviationFunction("Close");

//   if (loading) {
//     return (
//       <Box p={4} textAlign="center">
//         <Spinner size="xl" />
//         <Text mt={2}>Loading data...</Text>
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box p={4}>
//         <Text color="red.500">{error}</Text>
//       </Box>
//     );
//   }

//   return (
//     <Box p={4}>
//       <Text fontSize="2xl" fontWeight="bold" mb={4}>
//         Price Deviation Analysis ({interval})
//       </Text>

//       {/* Open Deviations */}
//       <Box mb={6} p={4} borderWidth={1} borderRadius="md">
//         <Text fontSize="lg" fontWeight="semibold" mb={2}>Open Price Deviations</Text>
//         <Text mb={2}>Total matches: {openDeviations.length}</Text>
//         {openDeviations.slice(0, 5).map((dev, index) => (
//           <Box key={index} p={2} bg="gray.50" mb={2} borderRadius="sm">
//             <Text fontSize="sm">Date: {new Date(dev.date).toLocaleString()}</Text>
//             <Text fontSize="sm">Actual: {dev.actual.toFixed(2)} | Predicted: {dev.predicted.toFixed(2)}</Text>
//             <Text fontSize="sm" fontWeight="bold">
//               Deviation: {dev.deviation.toFixed(2)} ({dev.deviationPercent.toFixed(2)}%)
//             </Text>
//           </Box>
//         ))}
//       </Box>

//       {/* High Deviations */}
//       <Box mb={6} p={4} borderWidth={1} borderRadius="md">
//         <Text fontSize="lg" fontWeight="semibold" mb={2}>High Price Deviations</Text>
//         <Text mb={2}>Total matches: {highDeviations.length}</Text>
//         {highDeviations.slice(0, 5).map((dev, index) => (
//           <Box key={index} p={2} bg="gray.50" mb={2} borderRadius="sm">
//             <Text fontSize="sm">Date: {new Date(dev.date).toLocaleString()}</Text>
//             <Text fontSize="sm">Actual: {dev.actual.toFixed(2)} | Predicted: {dev.predicted.toFixed(2)}</Text>
//             <Text fontSize="sm" fontWeight="bold">
//               Deviation: {dev.deviation.toFixed(2)} ({dev.deviationPercent.toFixed(2)}%)
//             </Text>
//           </Box>
//         ))}
//       </Box>

//       {/* Summary Statistics */}
//       <Box p={4} bg="blue.50" borderRadius="md">
//         <Text fontSize="lg" fontWeight="bold" mb={2}>Summary</Text>
//         <Text>Open: {openDeviations.length} matches</Text>
//         <Text>High: {highDeviations.length} matches</Text>
//         <Text>Low: {lowDeviations.length} matches</Text>
//         <Text>Close: {closeDeviations.length} matches</Text>
//       </Box>
//     </Box>
//   );
// }

// export default PriceDeviation;