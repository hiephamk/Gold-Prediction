import { useState, } from 'react';
import FxPredictionResult from '../components/GoldPrediction/FxPredictionResult'
import { Box, Button, Center, Container, Heading, HStack, Stack, VStack, Wrap, WrapItem } from '@chakra-ui/react'
import FxActualPredictedData from '../components/GoldPrediction/FxActualPredictedData';
import GoldActualData from '../components/GoldPrediction/GoldActualData';
import FxPredictionResult_Chart from '../components/GoldPrediction/FxPredictionResult_Chart';
import PriceDeviation from '../components/GoldPrediction/PriceDeviation';

const getInitialInterval = () => {
  return (
    (localStorage.getItem("fx-default-interval") as
      | '15m'
      | '30m'
      | '1h'
      | '4h'
      | '1d'
      | '1wk') ?? '1h'
  );
};
const GoldHomePage: React.FC = () => {
  const [interval, setPredictionInterval] = useState<'15m'| '30m'| '1h'| '4h'|'1d' | '1wk'>(getInitialInterval);
  
  const saveDefault = () => {
    localStorage.setItem("fx-default-interval", interval)
    alert("✅ Defaults saved!");
  }
  
  return (
    <VStack w={'100vw'}>
      <Center mb={"20px"}>
        <VStack>
          <HStack shadow="3px 3px 15px 5px rgb(75, 75, 79)" p={"10px"} rounded={"5px"} mt={'10px'} w={"100%"}>
            <form>
              <label>Prediction Interval</label>
              <select
                value={interval}
                onChange={(e) => setPredictionInterval(e.target.value as '15m'| '30m'| '1h'| '4h'| '1d' | '1wk')}
                style={{border:'1px solid', borderRadius:'3px', margin:'10px', padding:'5px'}}
              >
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
                <option value="1wk">1 Week</option>
              </select>
            </form>
            <Button onClick={saveDefault}>set default</Button>
          </HStack>
        </VStack>
      </Center>
      <Stack h={"fit-content"} gap={'10px'} justify={"center"} wrap={"wrap"} flexDirection={"row"}>
        <Box w={"1000px"} shadow="3px 3px 15px 5px rgb(75, 75, 79)" rounded={"7px"}>
          <FxPredictionResult interval={interval}/>
        </Box>
        <Box w={"1000px"} shadow="3px 3px 15px 5px rgb(75, 75, 79)" rounded={"7px"}>
          <FxActualPredictedData interval={interval}/>
        </Box>
          <Box w={"100%"} rounded={"7px"} shadow="3px 3px 15px 5px rgb(75, 75, 79)">
            <PriceDeviation interval={interval}/>
          </Box>
      </Stack>
    </VStack>
  )
}

export default GoldHomePage