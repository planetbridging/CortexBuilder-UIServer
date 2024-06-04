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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spacer,
  Flex,
  Grid,
  GridItem,
  VStack,
  StackDivider,
} from "@chakra-ui/react";
import React from "react";
import { RepeatIcon } from "@chakra-ui/icons";
import { OFixedFileManager } from "./OFileManagers";

class OAi extends React.Component {
  state = {
    selectedProject: null,
    selectedComputer: "",
    popNumber: 500,
    mountedWebModel: {},
    selectedGenerationFolder: "",
  };

  handleSelect = (project, pod) => {
    console.log("selected computer", pod);
    this.refreshPath(project, pod.ip);
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
    const { popNumber, selectedProject, selectedComputer } = this.state;
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
        ip: selectedComputer,
        amount: popNumber,
        aiPod: this.props.ip,
      };
      console.log("sending init:", sendData);
      const message = {
        type: "initializationPopulation",
        data: JSON.stringify(sendData),
      };
      this.props.ws.send(JSON.stringify(message));
    }
  }

  refreshPath(project, podIp) {
    const message = {
      type: "reqPathFromCacheForBeforeMounting",
      data: JSON.stringify({
        path: project,
        uuid: podIp,
      }),
    };
    this.props.ws.send(JSON.stringify(message));
  }

  itemGenerationActions(menuItemName, item) {
    const { selectedProject, selectedComputer,selectedGenerationFolder } = this.state;
    console.log(menuItemName, item);
    switch (menuItemName) {
      case "Select":
        const message = {
          type: "reqPathFromCacheForBeforeMountingShowingSelectedGeneration",
          data: JSON.stringify({
            path: selectedProject + "/" + item.name,
            uuid: selectedComputer,
          }),
        };
        this.props.ws.send(JSON.stringify(message));
        this.setState({selectedGenerationFolder: item.name});
        break;
        case "Open":
          var newuuidPath = selectedComputer.replace("12345", "4123");
          var tmpNewPath = selectedProject.replace("/path", "");
          var fullPath =
            "http://" +
            this.props.currentHost +
            ":4124/files/" +
            newuuidPath +
            tmpNewPath +
            "/" + selectedGenerationFolder+ "/"+
            item.name;
            //console.log(fullPath);
          //console.log(fullPath);
          window.open(fullPath, "_blank");
        break;
    }

    
  }

  render() {
    const { selectedComputer, selectedProject } = this.state;
    //console.log(this.props.podConfig, this.props.podConfig?.setProjectPath);
    return (
      <Box h="100%">
        <VStack
          divider={<StackDivider borderColor="gray.200" />}
          align="stretch"
          h="100%"
        >
          <Flex>
            <Box bg="teal.400" boxShadow="lg" p="1" borderRadius="md">
              <Stack>
                <Text size="xs">Selected Path</Text>
                <Input
                  size="xs"
                  variant="filled"
                  placeholder="Selected Path"
                  value={
                    selectedComputer
                      ? selectedComputer + " - " + selectedProject
                      : ""
                  }
                  isReadOnly
                />
              </Stack>
            </Box>
            <Spacer />
            <Box bg="teal.400" boxShadow="lg" p="1" borderRadius="md">
              <Stack>
                <Text size="xs">Mounted Models Server</Text>
                <Input
                  size="xs"
                  variant="filled"
                  placeholder="Selected Path"
                  value={selectedComputer ? "unknown" : ""}
                  isReadOnly
                />
              </Stack>
            </Box>
            <Spacer />
            <Box bg="teal.400" boxShadow="lg" p="1" borderRadius="md">
              <Stack>
                <Text size="xs">Mounted Model Web</Text>
                <Input
                  size="xs"
                  variant="filled"
                  placeholder="Selected Path"
                  value={selectedComputer ? "unkown" : ""}
                  isReadOnly
                />
              </Stack>
            </Box>
          </Flex>
          <Tabs isFitted variant="enclosed" h="100%" p="1" borderRadius="md">
            <TabList mb="1em">
              <Tab>Select & Mounting</Tab>
              <Tab>AI Manual Control Panel</Tab>
              <Tab>Random Mutation Hill Climbing (RMHC)</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <VStack
                  divider={<StackDivider borderColor="gray.200" />}
                  spacing={4}
                  align="stretch"
                  h="100%"
                >
                  <Box
                    h="calc((100% - 2px) / 3)"
                    bg="teal.400"
                    boxShadow="lg"
                    p="1"
                    borderRadius="md"
                    overflowY="auto"
                  >
                    {this.showCurrentProjects()}
                  </Box>
                  <Box h="calc((100% - 2px) / 3)">
                    <Box
                      bg="teal.400"
                      boxShadow="lg"
                      p="1"
                      borderRadius="md"
                      overflowY="auto"
                    >
                      <OFixedFileManager
                        contents={
                          this.props.reqPathFromCacheForBeforeMounting.contents
                        }
                        itemActions={this.itemGenerationActions.bind(this)}
                        menuItems={["Select", "Mount"]}
                      />
                    </Box>
                  </Box>
                  <Box
                    maxH="33vh"
                    bg="teal.400"
                    boxShadow="lg"
                    p="1"
                    borderRadius="md"
                    overflowY="scroll"
                  >
                    <OFixedFileManager
                      contents={
                        this.props
                          .reqPathFromCacheForBeforeMountingShowingSelectedGeneration
                          .contents
                      }
                      itemActions={this.itemGenerationActions.bind(this)}
                      menuItems={["Open","Mount Web (Here)", "Mount Server"]}
                    />
                  </Box>
                </VStack>
              </TabPanel>

              <TabPanel>
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
              </TabPanel>
              <TabPanel>
                <p>
                  Placeholder to build simple Random Mutation Hill Climbing
                  (RMHC) then move on to NEAT/GA
                </p>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    );
  }
}

export default OAi;

/*<Box >
                  <Grid
                    templateAreas={`"header header"
                      "nav main"
                      "nav footer"`}
                    gridTemplateRows={"100px 1fr 30px"}
                    gridTemplateColumns={"150px 1fr"}
                    h="80%"
                    gap="1"
                    color="blackAlpha.700"
                    fontWeight="bold"
                  >
                    <GridItem pl="2" area={"header"}>
                      {this.showCurrentProjects()}
                    </GridItem>
                    <GridItem pl="2" area={"nav"}>
                      <Box h="100%" overflowY="auto">
                        <OFixedFileManager
                          contents={
                            this.props.reqPathFromCacheForBeforeMounting.contents
                          }
                          itemActions={this.itemGenerationActions.bind(this)}
                          menuItems={["Select","Mount"]}
                        />
                      </Box>
                    </GridItem>
                    <GridItem pl="2" bg="green.300" area={"main"} overflowY="scroll">   
                     
                        <OFixedFileManager
                          contents={
                            this.props.reqPathFromCacheForBeforeMountingShowingSelectedGeneration.contents
                          }
                          itemActions={this.itemGenerationActions.bind(this)}
                          menuItems={["Mount Web (Here)","Mount Server"]}
                        />
                    </GridItem>
                    <GridItem pl="2" bg="blue.300" area={"footer"}>
                      (Will eventually show status)
                    </GridItem>
                  </Grid>
                </Box>*/
