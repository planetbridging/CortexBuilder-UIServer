import {
  Button,
  ButtonGroup,
  Stack,
  Text,
  Wrap,
  WrapItem,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Input,
  InputGroup,
} from "@chakra-ui/react";
import React from "react";
import { RepeatIcon } from "@chakra-ui/icons";

class OAi extends React.Component {
  state = {
    selectedProject: null,
    selectedComputer: "",
    popNumber: 500,
  };

  handleSelect = (project, pod) => {
    console.log("selected computer", pod);
    this.setState({ selectedProject: project, selectedComputer: pod.ip });
  };

  showCurrentProjects() {
    const { lstPods } = this.props;
    const podsArray = Array.from(lstPods.values());

    return (
      <Wrap>
        {podsArray
          .filter(
            (pod) =>
              pod.computerType === "data" &&
              pod.config &&
              pod.config.setProjectPath
          )
          .map((pod, index) => (
            <WrapItem key={index}>
              <Box
                bg={
                  this.state.selectedProject == pod.config.setProjectPath &&
                  this.state.selectedComputer == pod.ip
                    ? "teal.500"
                    : "gray.200"
                }
                p="10px"
                onClick={() =>
                  this.handleSelect(pod.config.setProjectPath, pod)
                }
              >
                {pod.ip}
                <Box mt="10px">Project Path: {pod.config.setProjectPath}</Box>
              </Box>
            </WrapItem>
          ))}
      </Wrap>
    );
  }

  //init
  btnSetupPopulation() {
    const { popNumber, selectedProject,selectedComputer } = this.state;
    /*type InitializationPopulation struct {
      Type string `json:"type"`
      Path string `json:"path"`
      Ip string `json:"ip"`
      Amount string `json:"amount"`
    }*/
    if (selectedProject) {
      console.log("Setting up population", popNumber);
      console.log("project path", selectedProject);
      console.log("project ip", selectedComputer);
      var sendData = {
        path: selectedProject,
        ip:selectedComputer,
        amount: popNumber,
        aiPod:this.props.ip,
      };
      console.log("sending init:",sendData);
      const message = {
        type: "initializationPopulation",
        data: JSON.stringify(sendData),
      };
      this.props.ws.send(JSON.stringify(message));
    }
  }

  render() {
    //console.log(this.props.podConfig, this.props.podConfig?.setProjectPath);
    return (
      <Stack bg="white">
        <Box overflowY="auto" maxH="90vh">
          <Stack>
            {this.showCurrentProjects()}
            <Accordion allowToggle>
              <AccordionItem>
                <AccordionButton>Genome Representation</AccordionButton>
                <AccordionPanel>
                  <Text>
                    Feed forward neural network (testing and development)
                  </Text>
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Population Initialization</AccordionButton>
                <AccordionPanel>
                  <Box padding="6" boxShadow="lg" bg="white">
                    <InputGroup>
                      <Input
                        value={this.state.popNumber}
                        onChange={(e) =>
                          this.setState({ popNumber: e.target.value })
                        }
                        placeholder="Enter number"
                        mb={3}
                      />
                      <Button
                        colorScheme="teal"
                        onClick={() => this.btnSetupPopulation()}
                      >
                        Setup
                      </Button>
                    </InputGroup>
                  </Box>
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Fitness Evaluation</AccordionButton>
                <AccordionPanel>
                  {/* Fitness Evaluation settings go here */}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Selection</AccordionButton>
                <AccordionPanel>
                  {/* Selection settings go here */}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Crossover (Recombination)</AccordionButton>
                <AccordionPanel>
                  {/* Crossover settings go here */}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Mutation</AccordionButton>
                <AccordionPanel>
                  {/* Mutation settings go here */}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Speciation</AccordionButton>
                <AccordionPanel>
                  {/* Speciation settings go here */}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Reproduction</AccordionButton>
                <AccordionPanel>
                  {/* Reproduction settings go here */}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Parameter Settings</AccordionButton>
                <AccordionPanel>
                  {/* Parameter Settings go here */}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton>Termination</AccordionButton>
                <AccordionPanel>
                  {/* Termination settings go here */}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Stack>
        </Box>
      </Stack>
    );
  }
}

export default OAi;
