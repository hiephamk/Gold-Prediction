import { useEffect, useState, useMemo, useEffectEvent } from "react";
import {
  Box,
  Center,
  Heading,
  Text,
  Spinner,
  SimpleGrid,
  Alert,
  Tabs,
  Icon,
} from "@chakra-ui/react";
import axios from "axios";
import Chart from "react-apexcharts";
import { BsGridFill } from "react-icons/bs";
import { FaThList } from "react-icons/fa";

interface CurrencyActualPrices {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

interface CurrencyOHLCPrediction {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface FxActualPredictedDataProps {
  interval: '15min'| '30min'| '45min' | '1h'| '4h'|'1day' | '1week';
  symbol: 'EURUSD=X' | 'JPY=X' | 'GBPUSD=X';
}

const CurrencyActualPredictedData: React.FC<FxActualPredictedDataProps> = ({interval, symbol}) => {
  const [CurrencyActualPrices, setCurrencyActualPrices] = useState<CurrencyActualPrices[]>([]);
  const [CurrencyPredictedData, setCurrencyPredictedData] = useState<CurrencyOHLCPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(30)

  // Convert "2025-04-05 14:00:00" → "2025-04-05T14:00:00"
  const toISO = (dateStr: string): string =>
    dateStr.includes("T") ? dateStr.trim() : dateStr.trim().replace(" ", "T");


  const fetch_actual_price = async () => {
    try {
      const { data } = await axios.post(
        "http://127.0.0.1:8000/api/currencty/actual-currency-prices/",
        { interval,symbol },
        { headers: { "Content-Type": "application/json" } }
      );

      const raw = data.data;

      if (!Array.isArray(raw) || raw.length === 0) {
        setCurrencyActualPrices([]);
        return;
      }

      const valid: CurrencyActualPrices[] = raw
        .map((row: any) => ({
          Date: toISO(String(row.Date)),
          Open: Number(row.Open),
          High: Number(row.High),
          Low: Number(row.Low),
          Close: Number(row.Close),
        }))
        .filter((d): d is CurrencyActualPrices => {
          const ts = new Date(d.Date).getTime();
          return !isNaN(ts) && !isNaN(d.Open) && !isNaN(d.High) && !isNaN(d.Low) && !isNaN(d.Close);
        });

      setCurrencyActualPrices(valid);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Unknown error";
      setError(`Failed to load actual prices: ${msg}`);
    }
  };

  /* -------------------------- API: Predicted -------------------------- */
  const fetch_predicted_prices = async () => {
    const url = `http://127.0.0.1:8000/api/currencty/historical-predicted-currency-prices/?symbol=${symbol}&interval=${interval}`;
    try {
      const { data } = await axios.get(url);

      const normalized = (data ?? []).map((p: any) => ({
        date: toISO(p.date),
        open: Number(p.open),
        high: Number(p.high),
        low: Number(p.low),
        close: Number(p.close),
        symbol:String(p.symbol),
        interval:String(p.interval)
      }));

      setCurrencyPredictedData(normalized);
    } catch (err: any) {
      setError("Failed to load predictions");
    }
  };
  /* -------------------------- Load Data -------------------------- */
  useEffect(() => {
  let isMounted = true;
  let timer: NodeJS.Timeout;

  const load = async () => {
    if (!isMounted) return;

    // Optional: clear old data on interval change
    setCurrencyActualPrices([]);
    setCurrencyPredictedData([]);
    setError(null);
    setLoading(true);

    try {
      await Promise.all([
        fetch_actual_price(),
        fetch_predicted_prices()
      ]);
    } catch (err: any) {
      if (isMounted) setError(err.message || "Failed to load data");
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  // Load immediately
  load();
  // Refresh every hour
  timer = setInterval(() => {
    load();
  }, 3_600_000); // 1 hour

  // Cleanup on unmount OR interval change
  return () => {
    isMounted = false;
    clearInterval(timer);
  };
}, [interval, symbol]);

useEffect(()=>{
  console.log("currency history pridicted data: ", CurrencyPredictedData)
})

  //xaxis time range helper:
  const apexchartsFormatDate = (timestamp: number, format: string): string => {
    const date = new Date(timestamp);
    const map: Record<string, string> = {
      "HH:mm": `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
      "MMM dd": date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      "MMM dd HH:mm": `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
      "MMM yyyy": date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    };
    return map[format] || "";
  };

  /* --------------------- Dynamic Lookback & Format --------------------- */
  const { lookbackPoints, xaxisFormat, tooltipFormat, tickAmount } = useMemo(() => {
    const match = interval.match(/^(\d+)([mh])|1([dwk])$/);
    if (!match) return { lookbackPoints: 20, xaxisFormat: "MMM dd HH:mm", tooltipFormat: "MMM dd, yyyy HH:mm", tickAmount: 10 };

    const value = match[1] ? parseInt(match[1]) : 1;
    const unit = match[2] || match[3];

    if (unit === "m" || unit === "h") {
        return {
          lookbackPoints: points,
          xaxisFormat: "MMM dd HH:mm",
          tooltipFormat: "MMM dd, HH:mm",
          tickAmount: 6, // ← Only 6 ticks max
        };
      }
    if (unit === "d") {
      return { lookbackPoints: points, xaxisFormat: "MMM dd", tooltipFormat: "MMM dd, yyyy", tickAmount: 12 };
    }
    if (unit === "w") {
      return { lookbackPoints: points, xaxisFormat: "MMM yyyy", tooltipFormat: "MMM dd, yyyy", tickAmount: 12};
    }

    return { lookbackPoints: points, xaxisFormat: "MMM dd HH:mm", tooltipFormat: "MMM dd, yyyy HH:mm", tickAmount: 12 };
  }, [interval, points, symbol]);

  /* --------------------- Min/Max X (Last N Candles) --------------------- */
  const { minX, maxX } = useMemo(() => {
  const timestamps = [
    ...CurrencyActualPrices.map(d => new Date(d.date ?? d.Date).getTime()),
    ...CurrencyPredictedData.map(d => new Date(d.date).getTime()),
  ].filter(ts => !isNaN(ts));

  if (timestamps.length === 0) {
    return { minX: undefined, maxX: undefined };
  }

  timestamps.sort((a, b) => a - b);

  const count = Math.max(1, lookbackPoints);
  const startIdx = Math.max(0, timestamps.length - count);

  return {
    minX: timestamps[startIdx],
    maxX: timestamps[timestamps.length - 1],
  };
}, [CurrencyActualPrices, CurrencyPredictedData, lookbackPoints]);

  /* --------------------- Y-axis Min/Max per Field --------------------- */
  const yAxisLimits = useMemo(() => {
    const fields: ("Open" | "High" | "Low" | "Close")[] = ["Open", "High", "Low", "Close"];

    return fields.reduce((acc, field) => {
      const aKey = field as keyof CurrencyActualPrices;
      const pKey = field.toLowerCase() as keyof CurrencyOHLCPrediction;

      const values = [
        ...CurrencyActualPrices.map(d => d[aKey]),
        ...CurrencyPredictedData.map(d => d[pKey]),
      ].filter(v => typeof v === "number" && !isNaN(v));

      if (values.length === 0) {
        acc[field] = { minY: undefined, maxY: undefined };
        return acc;
      }

      const rawMin = Math.min(...values);
      const rawMax = Math.max(...values);
      const range = rawMax - rawMin;
      const padding = range * 0.1; // 10% padding

      acc[field] = {
        minY: rawMin - padding,
        maxY: rawMax + padding,
      };

      return acc;
    }, {} as Record<"Open" | "High" | "Low" | "Close", { minY: number | undefined; maxY: number | undefined }>);
  }, [CurrencyActualPrices, CurrencyPredictedData]);

  /* --------------------- Build Chart Options per Field --------------------- */
  const buildOptions = (field: "Open" | "High" | "Low" | "Close") => {
    const { minY, maxY } = yAxisLimits[field];

    return {
      chart: { 
        type: "line", 
        height: 350, 
        zoom: { enabled: true }, 
        toolbar: { show: true } },
      stroke: { width: 2, curve: "smooth" },
      markers: {
        size: 4,
        colors: undefined,
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: { size: 6 },
      },
      xaxis: {
        type: "datetime",
        min: minX,
        max: maxX,
        tickAmount: tickAmount, // now 6–8
        labels: {
          datetimeUTC: false,
          format: xaxisFormat,
          formatter: (val) => apexchartsFormatDate(val, xaxisFormat),
        },
      },
      yaxis: {
        min: minY,
        max: maxY,
        labels: { formatter: (v: number) => `$${v.toFixed(4)}` },
      },
      legend: { 
        position: "top", 
        horizontalAlign: "center",
        fontSize: "14px",
        itemMargin: {
          horizontal: 10,
          vertical: 30,
  },
      },
      tooltip: {
          shared: true,
          intersect: false,
          x: { format: tooltipFormat },
          y: {
            formatter: (val: number) => `$${val.toFixed(4)}`,
          },
          theme: "dark",        // <-- auto white text
          style: {
            fontSize: "12px",
            color: "#fff",       // <-- text color
          },
          fillSeriesColor: false,
        },
      colors: ["#1f77b4", "#ff7f0e"],
      noData: { text: "No data available" },
      grid: { borderColor: "#e7e7e7", strokeDashArray: 4 },
    };
  };

  /* -------------------------- Build Series per Field -------------------------- */
  const buildSeries = (field: "Open" | "High" | "Low" | "Close") => {
    const aKey = field as keyof CurrencyActualPrices;
    const pKey = field.toLowerCase() as keyof CurrencyOHLCPrediction;

    const actual = CurrencyActualPrices
      .map(d => ({ x: new Date(d.Date).getTime(), y: d[aKey] }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));

    const predicted = CurrencyPredictedData
      .map(d => ({ x: new Date(d.date).getTime(), y: d[pKey] }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));

    return [
      { name: `Actual ${field}`, type: "line", data: actual },
      { name: `Predicted ${field}`, type: "line", data: predicted },
    ];
  };

  const hasData = CurrencyActualPrices.length > 0 || CurrencyPredictedData.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  const num = value === "" ? 0 : Number(value);
  if (!isNaN(num)) {
    setPoints(num);
  }
};

  return (
    <Box w="100%" border="1px solid" borderColor="gray.300" rounded="md" boxShadow="sm" p={4}>
      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="point">Points: </label>
        <input
          type="number"
          value={points}
          onChange={handleChange}
          min="0"
          style={{ width:'100px', border:"1px solid",borderRadius:"5px", padding:"5px", margin:"20px"}}
          id="point"
        />
        {/* <Button type="submit">Change</Button> */}
      </form>
      <Center mb={6}>
        <Heading fontSize="24px">Actual vs Predicted OHLC ({symbol} - Interval: {interval.toUpperCase()})</Heading>
      </Center>

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {loading && (
        <Center py="40px">
          <Spinner size="xl" color="blue.500" />
          <Text ml="4">Loading {interval} data…</Text>
        </Center>
      )}

      {!loading && hasData && (
        <Box mb={4} textAlign="center" fontSize="sm" color="gray.600">
          Showing last {lookbackPoints} candles • Format: {xaxisFormat}
        </Box>
      )}
        <Tabs.Root defaultValue={"grid"}>
          <Tabs.List>
            <Tabs.Trigger value="grid"><BsGridFill/></Tabs.Trigger>
            <Tabs.Trigger value="list"><FaThList/></Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="grid">
            {!loading && hasData && (
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                <ChartBox title="Open" series={buildSeries("Open")} options={buildOptions("Open")} />
                <ChartBox title="High" series={buildSeries("High")} options={buildOptions("High")} />
                <ChartBox title="Low" series={buildSeries("Low")} options={buildOptions("Low")} />
                <ChartBox title="Close" series={buildSeries("Close")} options={buildOptions("Close")} />
              </SimpleGrid>
            )}
          </Tabs.Content>
          <Tabs.Content value="list">
            {!loading && hasData && (
              <SimpleGrid gap={"10px"}>
                <ChartBox title="Open" series={buildSeries("Open")} options={buildOptions("Open")} />
                <ChartBox title="High" series={buildSeries("High")} options={buildOptions("High")} />
                <ChartBox title="Low" series={buildSeries("Low")} options={buildOptions("Low")} />
                <ChartBox title="Close" series={buildSeries("Close")} options={buildOptions("Close")} />
              </SimpleGrid>
            )}
          </Tabs.Content>
        </Tabs.Root>
      

      {!loading && !hasData && !error && (
        <Center py="20">
          <Text color="gray.500">No data for <strong>{interval}</strong>. Try another interval.</Text>
        </Center>
      )}
    </Box>
  );
};

const ChartBox: React.FC<{ title: string; series: any; options: any }> = ({
  title,
  series,
  options,
}) => (
  <Box p={4} rounded="md" border="1px solid" >
    <Heading size="md" mb={3} textAlign="center">{title}</Heading>
    <Chart options={options} series={series} type="line" height={350} />
  </Box>
);

export default CurrencyActualPredictedData;
