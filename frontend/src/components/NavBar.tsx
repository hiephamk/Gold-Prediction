import { Box, Heading, HStack } from '@chakra-ui/react'
import React from 'react'
import { IconButton} from "@chakra-ui/react"
import { useColorMode } from "../components/ui/color-mode"
import { LuMoon, LuSun } from "react-icons/lu"
import { NavLink } from 'react-router-dom'

const NavBar: React.FC = () => {
  const { toggleColorMode, colorMode } = useColorMode()
  return (
    <Box border={"1px solid"} rounded={"5px"} px={"10px"} py={"7px"}>
        <HStack justifyContent={"space-between"}>
          <NavLink to={'/gold/analytics'}><Heading fontWeight={"bold"}>Home</Heading></NavLink>
          <NavLink to={'/gold/prediction'}><Heading fontWeight={"bold"}>Gold Prediction</Heading></NavLink>
          {/* <NavLink to={'/currency/prdiction'}><Heading fontWeight={"bold"}>Currency Pairs</Heading></NavLink> */}
          <IconButton onClick={toggleColorMode} variant="outline" size="sm">
            {colorMode === "light" ? <LuSun /> : <LuMoon />}
          </IconButton>
        </HStack>
    </Box>
  )
}

export default NavBar