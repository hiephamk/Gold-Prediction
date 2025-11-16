import {useState, useEffect} from 'react'
import { Box, Button, Heading, Select } from '@chakra-ui/react'
import PriceDeviation from '../components/GoldPrediction/PriceDeviation';
import FxActualPredictedData from '../components/GoldPrediction/FxActualPredictedData';
import GoldActualData from '../components/GoldPrediction/GoldActualData';


const IntervalDefault = () => {
    return (
        localStorage.getItem('gold_analytic_interval_defaul') as '15m'|'30m'|'1h'|'4h'|'1d'|'1wk'
    )
};

const GoldAnalyticPage: React.FC = () => {
    const [interval, setInterval] = useState<'15m'|'30m'|'1h'|'4h'|'1d'|'1wk'>(IntervalDefault)

    const setIntervalDefaul = () => {
        localStorage.setItem('gold_analytic_interval_defaul', interval)
        alert("✅ Defaults interval saved!")
    }

  return (
    <Box>
        <label htmlFor="interval">Select Interval</label>
        <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as '15m'|'30m'|'1h'|'4h'|'1d'|'1wk')}
            id='interval'
            style={{border:'1px solid', borderRadius:'5px', padding:'5px', margin:'10px'}}
        >
            <option value={'15m'}>15 minutes</option>
            <option value={'30m'}>30 minutes</option>
            <option value={'1h'}>1 hour</option>
            <option value={'4h'}>4 hours</option>
            <option value={'1d'}>1 day</option>
            <option value={'1wk'}>1 week</option>
        </select>
        <Button onClick={setIntervalDefaul}>Set default</Button>
        <Box>
            <FxActualPredictedData interval={interval}/>
        </Box>
        <Box rounded={"7px"} shadow="3px 3px 15px 5px rgb(75, 75, 79)">
            <GoldActualData interval={interval}/>
        </Box>
        <Box shadow="3px 3px 15px 5px rgb(75, 75, 79)" mt={"20px"} rounded={"7px"}>
            <PriceDeviation interval={interval}/>
        </Box>
    </Box>
  )
}

export default GoldAnalyticPage