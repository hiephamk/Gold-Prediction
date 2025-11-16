// src/pages/RiskDisclaimer.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Heading,
  Text,
  VStack,
  Alert,
  List,
  Dialog,
  Portal,
} from '@chakra-ui/react';

const RiskDisclaimer: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [close, setClose] = useState(false)
  

  // Checkbox state
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const generateCode = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
  useEffect(() => {
    localStorage.getItem('riskDisclaimerAccepted');
    localStorage.getItem('riskDisclaimerCode');

  }, [navigate]);

  const handleAccept = () => {
    const code = generateCode();
    localStorage.setItem('riskDisclaimerAccepted', 'true');
    localStorage.setItem('riskDisclaimerCode', code);
    // navigate(`/dashboard/${code}`);
    setOpen(false)
    
  };

  return (
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
  );
};

export default RiskDisclaimer;

