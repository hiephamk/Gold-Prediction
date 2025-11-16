import GoldPredictedTrend from '../components/GoldPrediction/GoldPredictedTrend'
import FxPredictionResult_Chart from '../components/GoldPrediction/FxPredictionResult_Chart'
import { Box } from '@chakra-ui/react'
import React from 'react'

const HomePage = () => {
  return (
    <Box>
      <FxPredictionResult_Chart interval='1h'/>
      <GoldPredictedTrend interval='1h'/>
    </Box>
  )
}

export default HomePage