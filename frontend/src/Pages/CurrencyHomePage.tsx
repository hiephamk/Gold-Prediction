import CurrencyActualData from '../components/CurrencyPrediction/CurrencyActualData';
import CurrencyPredictionResult from '../components/CurrencyPrediction/CurrencyPredictionResult'
import { Box, Button, Center, Container, Heading, HStack, Text } from '@chakra-ui/react'
import {useEffect, useState} from 'react'
import CurrencyActualPredictedData from '../components/CurrencyPrediction/CurrencyActualPredictedData';

const getDefaultSymbol= () => {
  return (
    (localStorage.getItem("default-symbol") as
      | 'EURUSD=X'
      | 'JPY=X'
      | 'GBPUSD=X') ?? 'EURUSD=X'
  );
};
const getDefaultInterval = () => {
  return (
    (localStorage.getItem("default-interval") as
      | '15m'
      | '30m'
      | '1h'
      | '4h'
      | '1d'
      | '1wk') ?? '1h'
  );
};

const CurrencyHomePage:React.FC = () => {
  const [interval, setPredictionInterval] = useState<'15m'| '30m'| '1h'| '4h'|'1d' | '1wk'>(getDefaultInterval );
  const [symbol, setSymbol] = useState<'EURUSD=X' | 'JPY=X' | 'GBPUSD=X'>(getDefaultSymbol);

  const saveDefault = () => {
    localStorage.setItem("default-interval", interval)
    localStorage.setItem("default-symbol", symbol)
    alert("✅ Defaults saved!");
  }

  return (
    <Box>
      <Center my={"10px"}><Heading my={"20px"} fontSize="36px" fontWeight="bold">Currency Price Prediction</Heading></Center>
      <HStack justifyContent={"space-evenly"} border={"1px solid"} rounded={"5px"}>
        <Box>
          <form>
            <label>Prediction Interval</label>
            <select
              value={interval}
              onChange={(e) => setPredictionInterval(e.target.value as '15m'| '30m'| '1h'| '4h'| '1d' | '1wk')}
              style={{border:'1px solid', borderRadius:'3px', margin:'10px', padding:'5px'}}
            >
              {/* <option value="5m">5 Minutes (5m)</option> */}
              <option value="15m">15 Minutes (15m)</option>
              <option value="30m">30 Minutes (30m)</option>
              <option value="1h">1 Hour (1h)</option>
              <option value="4h">4 Hours (4h)</option>
              <option value="1d">Daily (1d)</option>
              <option value="1wk">Weekly (1wk)</option>
              {/* <option value="1mo">Monthly (1mo)</option> */}
            </select>
          </form>
        </Box>
        <Box>
          <form>
            <label>Prediction Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value as "EURUSD=X" | "JPY=X "| "GBPUSD=X")}
              style={{border:'1px solid', borderRadius:'3px', margin:'10px', padding:'5px'}}
            >
              {/* <option value="5m">5 Minutes (5m)</option> */}
              <option value="EURUSD=X">EUR/USD</option>
              <option value="GBPUSD=X">GBP/USD</option>
              <option value="JPY=X">USD/JPY</option>
            </select>
          </form>
        </Box>
        <Button onClick={saveDefault}>set default</Button>
      </HStack>
        <Box mt={'10px'}><CurrencyPredictionResult interval={interval} symbol={symbol}/></Box>
        <Box mt={"10px"} rounded={"7px"} shadow="3px 3px 15px 5px rgb(75, 75, 79)"><CurrencyActualData interval={interval} symbol={symbol}/></Box>
        <Box mt={'10px'} rounded={"7px"} shadow="3px 3px 15px 5px rgb(75, 75, 79)"><CurrencyActualPredictedData interval={interval} symbol={symbol}/></Box>
    </Box>
  )
}

export default CurrencyHomePage