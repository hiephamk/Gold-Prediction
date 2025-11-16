import { Box, Table, Spinner, Text, Alert, Heading, Center } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import formatDate from '../formatDate';
import Chart from "react-apexcharts";


interface CurrencyActualPrice {
  symbol:string;
  interval:string;
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Symbol:String;
  Interval:String;
}

interface Props {
  interval: '15m' | '30m' | '1h' | '4h' | '1d' | '1wk';
  symbol: 'EURUSD=X' | 'JPYUSD=X' | 'GBPUSD=X';
}

const toISO = (dateStr: string): string =>
  dateStr.includes('T') ? dateStr.trim() : dateStr.trim().replace(' ', 'T');

const CurrencyActualData: React.FC<Props> = ({ interval, symbol }) => {
  const [CurrencyActualPrice, setCurrencyActualPrice] = useState<CurrencyActualPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<any[]>([]);


  const fetchActualCurrency = async () => {
    try {
      const { data } = await axios.post(
        'http://127.0.0.1:8000/api/currencty/actual-currency-prices/',
        { interval, symbol },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const raw: any[] = data.data ?? [];

      console.log("currency Symbol: ", data.symbol)

      if (!Array.isArray(raw) || raw.length === 0) {
        setCurrencyActualPrice([]);
        return;
      }

      const parsed: CurrencyActualPrice[] = raw
        .map((row) => ({
          Date: toISO(String(row.Date)),
          Open: Number(row.Open),
          High: Number(row.High),
          Low: Number(row.Low),
          Close: Number(row.Close),
        }))
        .filter(
          (d): d is CurrencyActualPrice =>
            !isNaN(new Date(d.Date).getTime()) &&
            !isNaN(d.Open) &&
            !isNaN(d.High) &&
            !isNaN(d.Low) &&
            !isNaN(d.Close)
        );

      setCurrencyActualPrice(parsed);
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.message || 'Unknown error';
      setError(`Failed to load actual prices: ${msg}`);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrencyActualPrice([]);

    fetchActualCurrency().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, symbol]);

  useEffect(() => {
    console.log('actual currency Price (data):', CurrencyActualPrice);
  }, [CurrencyActualPrice]);

  useEffect(() => {
    if (!CurrencyActualPrice?.length) return;
    const currency_actual_candlestick_data = CurrencyActualPrice
    .slice(0,150)
    .map((d) => ({
      x: new Date(d.Date),
      y: [d.Open, d.High, d.Low, d.Close]
    }))
    setSeries([
      {
        name: `${symbol} - Actual OHLC`,
        type: "candlestick",
        data: currency_actual_candlestick_data,
      }
    ])
  },[CurrencyActualPrice])
  
  const options: any = {
    chart: {
      type: "candlestick",
      height: 500,
      toolbar: {show: true},
      zoom: { enable: false}
    },
    title: {
      text: `${symbol} - Actual Price - interval ${interval} (source: Yahoo Finance)`,
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
      tooltip: { 
        enabled: true,
      },
      labels: { formatter: (val: number) => val.toFixed(5)}
    },
    plotOptions: {
      candlestick: {
        color: {
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
        x: { format: "yyyy-MM-dd HH:mm"},
        custom: function ({ seriesIndex, dataPointIndex, w}: any){
          const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
          if (data.y && Array.isArray(data.y)){
            const [open, high, low, close] = data.y;
            return `
              <div style="padding: 10px; background: rgba(0,0,0,0.85); color: white; border-radius: 6px;">
              <div style="font-weight: bold; margin-bottom: 8px;">
                ${w.globals.seriesNames[seriesIndex]}
              </div>
              <div><strong>Open:</strong> $${open.toFixed(5)}</div>
              <div><strong>High:</strong> <span style="color: #00B746;">$${high.toFixed(5)}</span></div>
              <div><strong>Low:</strong> <span style="color: #EF403C;">$${low.toFixed(5)}</span></div>
              <div><strong>Close:</strong> $${close.toFixed(5)}</div>
            </div>
          `;
          }
          return ""
        },
      },
    stroke: {
      width: [1, 1, 2],
    },
    colors: ["#008FFB", "#FEB019", "#775DD0"],
  }

  return (
    <Box>
      <Box>
        {series.length > 0 && !loading && (
          <Box rounded={"7px"} border={"1px solid"} w={"100%"} pr={"30px"}>
            <Chart options={options} series={series} type="candlestick" height={"500px"}/>
          </Box>
        )}
      </Box>
      {/* <Box
      border="1px solid"
      borderColor="gray.300"
      w="100%"
      rounded="md"
      p={4}
      overflowX="auto"
    >
      <Center my={"20px"}><Heading fontSize={"24px"}>Actual Currency Price from yfinance</Heading></Center>
      {loading && (
        <Box textAlign="center" py={8}>
          <Spinner size="lg" color="blue.500" />
          <Text ml={3} display="inline">
            Loading {interval} data…
          </Text>
        </Box>
      )}
      {!loading && !error && CurrencyActualPrice.length > 0 && (
        <Table.Root size="sm" showColumnBorder>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              <Table.ColumnHeader>Open</Table.ColumnHeader>
              <Table.ColumnHeader>High</Table.ColumnHeader>
              <Table.ColumnHeader>Low</Table.ColumnHeader>
              <Table.ColumnHeader>Close</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {actualPrice
            .slice(0,5)
            .map((row, idx) => (
              <Table.Row key={idx}>
                <Table.Cell>{formatDate(row.Date)}</Table.Cell>
                <Table.Cell>{row.Open.toFixed(4)}</Table.Cell>
                <Table.Cell>{row.High.toFixed(4)}</Table.Cell>
                <Table.Cell>{row.Low.toFixed(4)}</Table.Cell>
                <Table.Cell>{row.Close.toFixed(4)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
      {!loading && !error && actualPrice.length === 0 && (
        <Text textAlign="center" color="gray.500" py={8}>
          No data available for <strong>{interval}</strong>.
        </Text>
      )}
      </Box> */}
    </Box>
  );
};

export default CurrencyActualData;