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
  ButtonGroup,
  Stack,
} from "@chakra-ui/react";
import React from "react";
import { FaComputer } from "react-icons/fa6";
import axios from "axios";
import { MinusIcon, AddIcon } from "@chakra-ui/icons";

import { FaFolder } from "react-icons/fa";
import { PiStepsFill } from "react-icons/pi";

import { ODrawer, OFunction, OShowType, OSystemInfo } from "./OTemplates";
import { OFileManager } from "./OFileManagers";

import logo from "./imgs/logo.jpg";
import bg from "./imgs/bg.jpg";
import OAi from "./OAi";
import { changeKey } from "./jsonHelper";
import OData from "./OData";

var currentHost = window.location.hostname;

var wsUrl = "ws://" + currentHost + ":4124";

class OHome extends React.Component {
  state = {
    ws: null,
    lstPods: new Map(),
    reqPathFromCache: {},
    reqPathFromCacheForBeforeMounting: {},
    reqPathFromCacheForBeforeMountingShowingSelectedGeneration: {},
    mountAIModelWeb: null,
    lstDataPods: [],
    lstAiPods: [],
    lstPodSpecs: new Map(),
    lstPodSpecsAi: new Map(),
    lstPodPath: new Map(),
    lstDataPodConfigs: new Map(),
    lstAiPodStatusUpdate: new Map(),
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
      console.log(evt.data);
      var message = JSON.parse(evt.data);

      message = changeKey(message, "type", "msgType");

      switch (message.msgType) {
        case "fulllist":
          console.log(message);

          for (var i in message.lstPods) {
            // console.log(message.lstPods[i].config);
            try {
              message.lstPods[i].config = JSON.parse(message[i].config);
            } catch {}
          }

          const resultMap = new Map(
            message.lstPods.map((item) => [item.ip, item])
          );
          console.log(resultMap);
          this.setState({ lstPods: resultMap });
          break;
        case "reqPathFromCache":
          delete message.uuid;
          this.setState({ reqPathFromCache: message });
          break;
        case "reqPathFromCacheForBeforeMounting":
          delete message.uuid;
          this.setState({ reqPathFromCacheForBeforeMounting: message });
          break;
        case "reqPathFromCacheForBeforeMountingShowingSelectedGeneration":
          delete message.uuid;
          this.setState({
            reqPathFromCacheForBeforeMountingShowingSelectedGeneration: message,
          });
          break;
        case "singleClientUpdate":
          console.log(message.singleClient);
          // Assuming 'key' is the key you want to update and 'value' is the new value
          this.setState((prevState) => {
            const updatedLstPods = new Map(prevState.lstPods);
            updatedLstPods.set(message.singleClient.ip, message.singleClient);
            return { lstPods: updatedLstPods };
          });

          break;
        case "evalStatusUpdate":
          //lstAiPodStatusUpdate

          this.setState((prevState) => {
            const updatedMap = new Map(prevState.lstAiPodStatusUpdate);
            updatedMap.set(message.pod, message);
            return { lstAiPodStatusUpdate: updatedMap };
          });
          break;
      }
    };

    ws.onclose = () => {
      console.log("disconnected");
    };
    this.setState({ ws: ws });
  }

  async getRequest(link, item) {
    switch (item) {
      case "getAiModel":
        var getAiModel = await axios.get(link);
        console.log(getAiModel.data);
        this.setState({ mountAIModelWeb: getAiModel.data });
        break;
    }
  }

  async refreshADataPodConfig(uuid) {
    const { lstDataPodConfigs } = this.state;
    console.log(uuid);
    try {
      var newPort = uuid.replace("12345", "4123");
      var configUrlPath =
        "http://" + currentHost + ":4124/files/" + newPort + "/config.json";
      var configDataReq = await axios.get(configUrlPath);
      var configData = configDataReq.data;
      console.log(configData);
      lstDataPodConfigs.set(uuid, configData);
      console.log("--------new data pod config-------");
      console.log(lstDataPodConfigs);
      this.setState({ lstDataPodConfigs: lstDataPodConfigs });
    } catch (ex) {
      console.log("Unable to load config", ex);
    }
  }

  shortenUUID(uuid) {
    if (uuid.includes("-")) {
      var s = uuid.split("-")[0];
      return s;
    }
    return uuid;
  }

  renderAllPods() {
    const {
      lstPods,
      ws,
      reqPathFromCache,
      reqPathFromCacheForBeforeMounting,
      reqPathFromCacheForBeforeMountingShowingSelectedGeneration,
      mountAIModelWeb,
      lstAiPodStatusUpdate,
    } = this.state;
    // Convert the Map to an array of [key, value] pairs
    console.log(reqPathFromCache);
    console.log(lstPods);
    console.log(reqPathFromCacheForBeforeMounting);
    var lst = Array.from(lstPods.entries()).map(([key, item], index) => (
      <WrapItem key={index}>
        <Card>
          <CardHeader>
            <ButtonGroup>
              <ODrawer
                header={"Specs"}
                btnSize={"sm"}
                btnOpenText={<OShowType pcType={item.computerType} />}
                content={
                  <OSystemInfo
                    ip={key}
                    os={item.os}
                    ram={item.ram}
                    cpu={item.cpu}
                  />
                }
              />
              <Text>{key}</Text>
            </ButtonGroup>
          </CardHeader>
          <CardBody>
            {item.computerType == "data" ? (
              <Stack>
                <Text>Project: {item.config.setProjectPath}</Text>
                <Text>
                  <ODrawer
                    size={"full"}
                    btnOpenText="Data: "
                    header={"Data - " + item.mountedData}
                    content={
                      <OData
                        dataPath={item.mountedData}
                        dataSpecs={item.mountedDetails}
                        dataIp={item.ip}
                        currentHost={currentHost}
                      />
                    }
                  />
                  {item.mountedData}
                </Text>
              </Stack>
            ) : (
              this.state.lstAiPodStatusUpdate.has(item.ip) && (
                <p>
                  Eval:{" "}
                  {this.state.lstAiPodStatusUpdate.get(item.ip).current +
                    "/" +
                    this.state.lstAiPodStatusUpdate.get(item.ip).total}
                </p>
              )
            )}
          </CardBody>
          <CardFooter>
            {item.computerType == "data" ? (
              <ODrawer
                header={"System info"}
                content={
                  <OFileManager
                    ws={ws}
                    uuid={key}
                    podPath={reqPathFromCache.path}
                    podConfig={item.config}
                    refreshADataPodConfig={this.refreshADataPodConfig}
                    currentHost={currentHost}
                    contents={reqPathFromCache.contents}
                  />
                }
                btnOpenText={<FaFolder />}
                btnSize={"sm"}
                placement={"top"}
              />
            ) : (
              <ODrawer
                header={"AI - " + item.ip}
                content={
                  <OAi
                    ip={item.ip}
                    lstPods={lstPods}
                    ws={this.state.ws}
                    reqPathFromCacheForBeforeMounting={
                      reqPathFromCacheForBeforeMounting
                    }
                    reqPathFromCacheForBeforeMountingShowingSelectedGeneration={
                      reqPathFromCacheForBeforeMountingShowingSelectedGeneration
                    }
                    currentHost={currentHost}
                    getRequest={this.getRequest.bind(this)}
                    mountAIModelWeb={mountAIModelWeb}
                    evalStatus={this.state.lstAiPodStatusUpdate.get(item.ip)}
                  />
                }
                btnOpenText={<PiStepsFill />}
                btnSize={"sm"}
                placement={"top"}
                size="full"
              />
            )}
          </CardFooter>
        </Card>
      </WrapItem>
    ));
    return <Wrap>{lst}</Wrap>;
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

        {this.renderAllPods()}
      </Box>
    );
  }
}

export default OHome;
