import {
  Heading,
  Wrap,
  WrapItem,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  VStack,
  Text,
  HStack,
  Box,
  Button,
  Image,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import React from "react";
import { FaComputer } from "react-icons/fa6";
import axios from "axios";
import { MinusIcon, AddIcon } from "@chakra-ui/icons";

import {
  ODrawer,
  OFileManager,
  OFunction,
  OShowType,
  OSystemInfo,
} from "./OTemplates";

import logo from "./imgs/logo.jpg";
import bg from "./imgs/bg.jpg";
import OAi from "./OAi";

var currentHost = window.location.hostname;

var wsUrl = "ws://" + currentHost + ":4124";

class OHome extends React.Component {
  state = {
    ws: null,
    lstDataPods: [],
    lstAiPods: [],
    lstPodSpecs: new Map(),
    lstPodSpecsAi: new Map(),
    lstPodPath: new Map(),
    lstDataPodConfigs: new Map(),
  };

  constructor(props) {
    super(props);
    this.refreshADataPodConfig = this.refreshADataPodConfig.bind(this);
  }

  componentDidMount() {
    const ws = new WebSocket(wsUrl + "/ws");
    ws.onopen = () => {
      console.log("connected");

      const message = {
        type: "ping",
        data: "",
      };
      ws.send(JSON.stringify(message));
    };
    ws.onmessage = (evt) => {
      const message = JSON.parse(evt.data);
      //console.log(message);
      switch (message.Type) {
        case "pong":
          console.log("received pong");
          break;
        case "getClients":
          //console.log(message);
          // Parse new client data
          const lstDataPods = JSON.parse(message.lstDataCache);

          const dataPodsMap = lstDataPods.reduce((acc, client) => {
            acc.set(client.uuid, client);
            return acc;
          }, new Map());

          const currentLstDataPods = this.state.lstDataPods.reduce(
            (acc, client) => {
              acc.set(client.uuid, client);
              return acc;
            },
            new Map()
          );

          var lstCurrent = this.state.lstDataPods;
          var changeFound = false;

          for (const [key, value] of dataPodsMap.entries()) {
            if (!currentLstDataPods.has(key)) {
              lstCurrent.push(value);
              changeFound = true;
            }
          }

          for (var i in lstCurrent) {
            if (!dataPodsMap.has(lstCurrent[i].uuid)) {
              lstCurrent.splice(i, 1);
              changeFound = true;
            }
          }

//------------ai sorting hat
        
          const lstAiPods = JSON.parse(message.lstAiPods);

          const dataAIMap = lstAiPods.reduce((acc, client) => {
            acc.set(client.uuid, client);
            return acc;
          }, new Map());

          const currentlstAiPods = this.state.lstAiPods.reduce(
            (acc, client) => {
              acc.set(client.uuid, client);
              return acc;
            },
            new Map()
          );

          var lstCurrentAI = this.state.lstAiPods;
          var changeAiFound = false;

          for (const [key, value] of dataAIMap.entries()) {
            if (!currentlstAiPods.has(key)) {
              lstCurrentAI.push(value);
              changeAiFound = true;
            }
          }

          for (var i in lstCurrentAI) {
            if (!dataAIMap.has(lstCurrentAI[i].uuid)) {
              lstCurrentAI.splice(i, 1);
              changeAiFound = true;
            }
          }

          if(changeAiFound || changeFound){
            const message = {
              type: "ping",
              data: "",
            };
            ws.send(JSON.stringify(message));
            this.setState({
              lstDataPods: lstCurrent,
            });
          }

          if (changeFound && !changeAiFound) {
            this.setState({
              lstDataPods: lstCurrent,
            });
          }else if(!changeFound && changeAiFound){
            this.setState({
              lstAiPods: lstCurrentAI,
            });
          }else if(changeFound && changeAiFound){
            this.setState({
              lstAiPods: lstCurrentAI,
              lstDataPods: lstCurrent,
            });
          }

          break;
        default:
          //console.log("unknown message type:", message.Type);
          //console.log(message);
          this.mainMsgs(message);
      }
    };

    ws.onclose = () => {
      console.log("disconnected");
    };
    this.setState({ ws: ws });
  }

  async refreshADataPodConfig(uuid) {
    const { lstDataPodConfigs } = this.state;

    try {
      var configUrlPath =
        "http://" + currentHost + ":4124/files/" + uuid + "/config.json";
      var configDataReq = await axios.get(configUrlPath);
      var configData = configDataReq.data;

      lstDataPodConfigs.set(uuid, configData);
      console.log("--------new data pod config-------");
      console.log(lstDataPodConfigs);
      this.setState({ lstDataPodConfigs: lstDataPodConfigs });
    } catch (ex) {
      console.log("Unable to load config", ex);
    }
  }

  async mainMsgs(msg) {
    switch (msg.cmd) {
      case "sysinfo":
        if (msg.pcType == "dataCache") {
          var lstMpTmp = this.state.lstPodSpecs;
          if (!lstMpTmp.has(msg.id)) {
            const tmpId = msg.id;
            delete msg.id;
            lstMpTmp.set(tmpId, msg);
            var lstPodPathTmp = this.state.lstPodPath;
            lstPodPathTmp.set(tmpId, null);
            var lstDataPodConfigs = this.state.lstDataPodConfigs;
            try {
              var configUrlPath =
                "http://" +
                currentHost +
                ":4124/files/" +
                tmpId +
                "/config.json";
              var configDataReq = await axios.get(configUrlPath);
              var configData = configDataReq.data;

              lstDataPodConfigs.set(tmpId, configData);
              console.log("--------new data pod config-------");
              console.log(lstDataPodConfigs);
            } catch (ex) {
              console.log("Unable to load config", ex);
            }

            this.setState({
              lstPodSpecs: lstMpTmp,
              lstPodPath: lstPodPathTmp,
              lstDataPodConfigs: lstDataPodConfigs,
            });
          }
        } else if (msg.pcType == "aiPod") {
          var lstMpTmp = this.state.lstPodSpecsAi;
          if (!lstMpTmp.has(msg.id)) {
            const tmpId = msg.id;
            delete msg.id;
            lstMpTmp.set(tmpId, msg);
            this.setState({
              lstPodSpecsAi: lstMpTmp,
            });
          }
        }

        break;
    }

    switch (msg.type) {
      case "reqPathFromCache":
        if (this.state.lstPodPath.has(msg.uuid)) {
          var lstPodPathTmp = this.state.lstPodPath;
          const tmpId = msg.uuid;
          delete msg.uuid;
          lstPodPathTmp.set(tmpId, msg);
          this.setState({ lstPodPath: lstPodPathTmp });
        }
        break;
    }
  }

  shortenUUID(uuid) {
    if (uuid.includes("-")) {
      var s = uuid.split("-")[0];
      return s;
    }
    return uuid;
  }

  fixingNewSyncManuallyRebuilding() {
    const { ws, lstPodPath, lstDataPods, lstPodSpecs, lstDataPodConfigs } =
      this.state;
    var lst = [];

    for (var tmpClientUUID in lstDataPods) {
      const client = lstDataPods[tmpClientUUID];
      var podSpec = lstPodSpecs.get(client.uuid);
      const podConfig = lstDataPodConfigs.get(client.uuid);
      if (podSpec == null || podSpec == undefined) {
        podSpec = {
          arch: "",
          cachePath: "",
          cmd: "",
          ip: "",
          numCPU: "",
          os: "",
          pcType: "",
          port: "",
          id: client.uuid,
        };
      }

      if (client != null || client != undefined) {
        lst.push(
          <WrapItem key={client.uuid}>
            <Card
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <CardHeader>
                <Heading size="md">
                  <HStack>
                    <OShowType pcType={podSpec.pcType} />
                    <Text color="white">{this.shortenUUID(client.uuid)}</Text>
                    {podSpec && (
                      <ODrawer
                        header={"System info"}
                        content={
                          <OSystemInfo
                            id={client.uuid}
                            arch={podSpec.arch}
                            cachePath={podSpec.cachePath}
                            ip={podSpec.ip}
                            numCPU={podSpec.numCPU}
                            os={podSpec.os}
                            port={podSpec.port}
                          />
                        }
                        btnOpenText={<FaComputer />}
                        btnSize={"sm"}
                      />
                    )}
                  </HStack>
                </Heading>
              </CardHeader>

              <CardBody>
                <OAi
                  podConfig={podConfig}
                  refreshADataPodConfig={this.refreshADataPodConfig}
                  uuid={client.uuid}
                  podSpec={podSpec}
                />
              </CardBody>
              <CardFooter>
                <HStack>
                  <ODrawer
                    header={"System info"}
                    content={
                      <OFileManager
                        ws={ws}
                        uuid={client.uuid}
                        podPath={lstPodPath.get(client.uuid)}
                        podConfig={podConfig}
                        refreshADataPodConfig={this.refreshADataPodConfig}
                        currentHost={currentHost}
                      />
                    }
                    btnOpenText={
                      <OFunction
                        pcType={podSpec.pcType}
                        uuid={client.uuid}
                        cachePath={podSpec.cachePath}
                      />
                    }
                    btnSize={"sm"}
                    placement={"top"}
                  />
                </HStack>
              </CardFooter>
            </Card>
          </WrapItem>
        );
      }
    }

    return <Wrap>{lst}</Wrap>;
  }

  fixingNewSyncManuallyRebuildingAI() {
    const { ws, lstAiPods, lstPodSpecsAi } =
      this.state;
    var lst = [];

    for (var tmpClientUUID in lstAiPods) {
      const client = lstAiPods[tmpClientUUID];
      var podSpec = lstPodSpecsAi.get(client.uuid);
      if (podSpec == null || podSpec == undefined) {
        podSpec = {
          arch: "",
          cachePath: "",
          cmd: "",
          ip: "",
          numCPU: "",
          os: "",
          pcType: "",
          port: "",
          id: client.uuid,
        };
      }
      console.log(client);
      if (client != null || client != undefined) {
        lst.push(
          <WrapItem key={client.uuid}>
            <Card
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <CardHeader>
                <Heading size="md">
                  <HStack>
                    <OShowType pcType={podSpec.pcType} />
                    <Text color="white">{this.shortenUUID(client.uuid)}</Text>
                    {podSpec && (
                      <ODrawer
                        header={"System info"}
                        content={
                          <OSystemInfo
                            id={client.uuid}
                            arch={podSpec.arch}
                            cachePath={podSpec.cachePath}
                            ip={podSpec.ip}
                            numCPU={podSpec.numCPU}
                            os={podSpec.os}
                            port={podSpec.port}
                          />
                        }
                        btnOpenText={<FaComputer />}
                        btnSize={"sm"}
                      />
                    )}
                  </HStack>
                </Heading>
              </CardHeader>

              <CardBody>
                <p>placeholder</p>
              </CardBody>
              <CardFooter>
                <p>placeholder</p>
              </CardFooter>
            </Card>
          </WrapItem>
        );
      }
    }

    return <Wrap>{lst}</Wrap>;
  }

  oldImplementationDysyncIssues() {
    const { ws, lstPodPath, lstDataPods, lstPodSpecs } = this.state;
    return (
      <Wrap>
        {lstDataPods.map((client, index) => {
          const podSpec = lstPodSpecs.get(client.uuid);
          if (!podSpec) {
            try {
              podSpec = {
                arch: "",
                cachePath: "",
                cmd: "",
                ip: "",
                numCPU: "",
                os: "",
                pcType: "",
                port: "",
                id: client.uuid,
              };
            } catch {}
          }
          //console.log(podSpec);
          if (podSpec == undefined || podSpec == null) {
            return;
          }
          return (
            <WrapItem key={client.uuid}>
              <Card
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                <CardHeader>
                  <Heading size="md">
                    <HStack>
                      <OShowType pcType={podSpec.pcType} />
                      <Text color="white">{this.shortenUUID(client.uuid)}</Text>
                      {podSpec && (
                        <ODrawer
                          header={"System info"}
                          content={
                            <OSystemInfo
                              id={client.uuid}
                              arch={podSpec.arch}
                              cachePath={podSpec.cachePath}
                              ip={podSpec.ip}
                              numCPU={podSpec.numCPU}
                              os={podSpec.os}
                              port={podSpec.port}
                            />
                          }
                          btnOpenText={<FaComputer />}
                          btnSize={"sm"}
                        />
                      )}
                    </HStack>
                  </Heading>
                </CardHeader>

                <CardBody></CardBody>
                <CardFooter>
                  <HStack>
                    <ODrawer
                      header={"System info"}
                      content={
                        <OFileManager
                          ws={ws}
                          uuid={client.uuid}
                          podPath={lstPodPath.get(client.uuid)}
                        />
                      }
                      btnOpenText={
                        <OFunction
                          pcType={podSpec.pcType}
                          uuid={client.uuid}
                          cachePath={podSpec.cachePath}
                        />
                      }
                      btnSize={"sm"}
                      placement={"top"}
                    />
                  </HStack>
                </CardFooter>
              </Card>
            </WrapItem>
          );
        })}
      </Wrap>
    );
  }

  customAccordion(items) {
    if (!items || !Array.isArray(items)) {
      return null;
    }

    return (
      <Box
        width="100%"
        height={"80%"}
        mx="auto"
        my="4"
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
      >
        <Accordion allowMultiple defaultIndex={items.map((_, index) => index)}>
          {items.map((item, index) => (
            <AccordionItem key={index}>
              {({ isExpanded }) => (
                <>
                  <h2>
                    <AccordionButton
                      _hover={{ bg: "gray.200" }}
                      bg="gray.100"
                      _expanded={{ bg: "blue.400", color: "white" }}
                    >
                      <Box as="span" flex="1" textAlign="left">
                        {item.title}
                      </Box>
                      {isExpanded ? (
                        <MinusIcon fontSize="12px" />
                      ) : (
                        <AddIcon fontSize="12px" />
                      )}
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} overflow="auto">
                    {item.content}
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
          ))}
        </Accordion>
      </Box>
    );
  }

  render() {
    const { ws, lstPodPath, lstDataPods, lstPodSpecs } = this.state;
    console.log(lstDataPods);
    return (
      <Box
        h="100vh"
        w="100vw"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover" }}
      >
        <Box w="100vw">
          <Button
            style={{ backgroundImage: `url(${logo})`, backgroundSize: "cover" }}
          >
            <Text color="white">Cortex Builder</Text>
          </Button>
        </Box>

        {this.customAccordion([
          {
            title: "Data caches",
            content: this.fixingNewSyncManuallyRebuilding(),
          },
          { title: "Ai pods", content: this.fixingNewSyncManuallyRebuildingAI() },
        ])}
      </Box>
    );
  }
}

export default OHome;
