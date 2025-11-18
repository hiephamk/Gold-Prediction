import { BrowserRouter as Routers, Routes, Route } from 'react-router-dom'
import GoldHomePage from './Pages/GoldHomePage'
import RiskDisclaimer from './Pages/RiskDisclaimer'
import DashBoard from './Pages/DashBoard'
import GoldAnalyticPage from './Pages/GoldAnalyticPage'
import CurrencyHomePage from './Pages/CurrencyHomePage'

function App() {

  return (
    <Routers>
      <Routes>
        <Route path='/' element={<DashBoard/>}>
          <Route index element={<GoldAnalyticPage/>}/>
          <Route path='/gold/prediction' element={<GoldHomePage/>}/>
          {/* <Route path='/gold/analytics' element={<GoldAnalyticPage/>}/> */}
          <Route path='/gold/analytics' element={<GoldAnalyticPage/>}/>
          <Route path='/currency/prdiction' element={<CurrencyHomePage/>}/>
          <Route path='/rish-disclaimer' element={<RiskDisclaimer/>}/>
        </Route>
      </Routes>
    </Routers>
  )
}

export default App
