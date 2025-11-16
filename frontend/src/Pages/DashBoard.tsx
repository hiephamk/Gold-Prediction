// src/pages/DashBoard.tsx
import { useState, useEffect } from 'react';
import {Container, Box, Dialog, Portal, VStack, Button, Text, Heading, List, Alert, Checkbox,} from '@chakra-ui/react';
import Footer from '../components/Footer';
import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

const DashBoard: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [isAccepted, setIsAccepted] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem("riskDisclaimerAccepted");
    if (accepted === "true") {
      setOpen(false);
      setIsAccepted(true)
    } else {
      setOpen(true);
      setIsAccepted(false)
    }
  }, []);

  const handleAccept = () => {
    if (!isChecked) return;
    localStorage.setItem("riskDisclaimerAccepted", "true");
    setOpen(false);
    // setIsAccepted(true)
    window.location.reload();
  };

  return (
    <Container w={"1100px"}>
      <VStack gap={'10px'}>
        <Box w={'100%'}><NavBar/></Box>
        <Box>
          <Dialog.Root defaultOpen={open} open={open}>
            <Portal>
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Body>
                            <Dialog.Title>Risk Disclaimer!!!</Dialog.Title>
                            <Dialog.Description>
                                <VStack gap={6} align="stretch">
                                    {/* Title */}
                                    <Heading as="h1" size="xl" textAlign="center" color="red.600">
                                    EDUCATIONAL ONLY – NOT INVESTMENT ADVICE
                                    </Heading>

                                    {/* Main warning text */}
                                    <Text>
                                    These predictions are computer-generated estimates based on
                                    historical data and statistical models. They may be inaccurate. Do
                                    not trade based solely on these predictions.
                                    </Text>

                                    <Text>
                                    Past accuracy does not guarantee future accuracy. Gold prices are
                                    affected by countless unpredictable factors. Consult a licensed
                                    financial advisor before trading.
                                    </Text>

                                    {/* High-risk alert (optional, nice touch) */}
                                    <Alert.Root status="warning" variant="subtle">
                                    <Alert.Indicator />
                                    <Alert.Content>
                                        <Alert.Title>High Risk</Alert.Title>
                                        <Alert.Description>
                                        You can lose all of your invested capital.
                                        </Alert.Description>
                                    </Alert.Content>
                                    </Alert.Root>

                                    {/* Key Risks List */}
                                    <Box>
                                    <Text fontWeight="bold" mb={2}>
                                        Key Risks You Must Understand:
                                    </Text>
                                    <List.Root gap={2} pl={5}>
                                        <List.Item>No investment advice provided.</List.Item>
                                        <List.Item>Predictions may be wrong.</List.Item>
                                        <List.Item>Substantial losses are possible.</List.Item>
                                        <List.Item>Leverage magnifies risk.</List.Item>
                                        <List.Item>Market volatility is unpredictable.</List.Item>
                                        <List.Item>We are not liable for any losses.</List.Item>
                                    </List.Root>
                                    </Box>

                                    {/* Checkbox + Label */}
                                    <Checkbox.Root
                                    checked={isChecked}
                                    onCheckedChange={(e) => setIsChecked(e.checked as boolean)}
                                    >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label ml={2}>
                                        <Text fontSize="sm">
                                        I have read and understand the risks involved in trading gold. I
                                        acknowledge that all predictions are educational only and not
                                        investment advice. I accept full responsibility for my trading
                                        decisions and agree to hold this website harmless for any losses.
                                        </Text>
                                    </Checkbox.Label>
                                    </Checkbox.Root>

                                    {/* Accept Button – only enabled when checked */}
                                    <Button
                                    colorScheme="green"
                                    size="lg"
                                    onClick={handleAccept}
                                    disabled={!isChecked}
                                    alignSelf="flex-start"
                                    >
                                    I Accept the Risk
                                    </Button>
                                </VStack>
                            </Dialog.Description>
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </Box>
        <Box w={"100%"}>
          <Outlet/>
        </Box>
        <Box my={"20px"} p={"10px"} h={"50px"} borderTop={"2px solid"} w={"100%"}>
          <Footer/>
        </Box>
      </VStack>
    </Container>
  );
};

export default DashBoard;