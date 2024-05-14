import logo from "./logo.svg";
import "./App.css";

import { ChakraProvider } from "@chakra-ui/react";
import OHome from "./OHome";

function App() {
  return (
    <ChakraProvider>
      <OHome />
    </ChakraProvider>
  );
}

export default App;
