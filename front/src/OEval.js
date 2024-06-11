import React from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  NumberInput,
  NumberInputField,
  Text,
} from "@chakra-ui/react";

class OEval extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      training: 70,
      testing: 30,
    };
  }

  handleInputChange = (name) => (value) => {
    this.setState({
      [name]: value,
      [name === "training" ? "testing" : "training"]: 100 - value,
    });
  };

  handleStartEval = () => {
    console.log(`Training: ${this.state.training}%`);
    console.log(`Testing: ${this.state.testing}%`);
    if (
      this.props.selectedComputer &&
      this.props.selectedDataPath &&
      this.props.selectedProject
    ) {
      var tmp = {
        selectedComputer: this.props.selectedComputer.split(":")[0],
        selectedDataPath: this.props.selectedDataPath,
        selectedProject: this.props.selectedProject,
        training: parseInt(this.state.training),
        testing: parseInt(this.state.testing),
        aiPod: this.props.aiPod,
      };
      const message = {
        type: "startEval",
        data: JSON.stringify(tmp),
      };
      console.log(message);
      this.props.ws.send(JSON.stringify(message));
    }
  };

  render() {
    return (
      <Box p={5} shadow="md" borderWidth="1px">
        <Text>Split data into training and testing for eval</Text>
        <HStack spacing={5}>
          <InputGroup maxW="200px">
            <InputLeftAddon>Training</InputLeftAddon>
            <NumberInput
              max={100}
              min={0}
              value={this.state.training}
              onChange={this.handleInputChange("training")}
            >
              <NumberInputField />
            </NumberInput>
          </InputGroup>
          <InputGroup maxW="200px">
            <NumberInput
              max={100}
              min={0}
              value={this.state.testing}
              onChange={this.handleInputChange("testing")}
            >
              <NumberInputField />
            </NumberInput>
            <InputRightAddon>Testing</InputRightAddon>
          </InputGroup>
        </HStack>
        <Button mt={4} colorScheme="teal" onClick={this.handleStartEval}>
          Start Evaluation
        </Button>
      </Box>
    );
  }
}

export default OEval;
