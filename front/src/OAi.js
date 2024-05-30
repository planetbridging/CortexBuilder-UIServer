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
} from "@chakra-ui/react";
import React from "react";
import { RepeatIcon } from "@chakra-ui/icons";

class OAi extends React.Component {
  state = {
    selectedProject: null,
  };

  handleSelect = (project) => {
    this.setState({ selectedProject: project });
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
                  this.state.selectedProject === pod.computerType
                    ? "teal.500"
                    : "gray.200"
                }
                p="10px"
                onClick={() => this.handleSelect(pod.computerType)}
              >
                {pod.ip}
                <Box mt="10px">Project Path: {pod.config.setProjectPath}</Box>
              </Box>
            </WrapItem>
          ))}
      </Wrap>
    );
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
                  {/* Population Initialization settings go here */}
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
