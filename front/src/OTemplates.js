import React from "react";
import {
  Box,
  Text,
  Flex,
  Heading,
  Stack,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  WrapItem,
  Wrap,
  ButtonGroup,
  InputLeftAddon,
  InputGroup,
  Input,
  Spacer,
} from "@chakra-ui/react";

import { FaDatabase } from "react-icons/fa6";
import { FaFolder } from "react-icons/fa";
import { FiFolder, FiFileText } from "react-icons/fi";
import { ChevronDownIcon, RepeatIcon } from "@chakra-ui/icons";

export class OSystemInfo extends React.Component {
  render() {
    const { arch, cachePath, cmd, id, ip, numCPU, os, pcType, port } =
      this.props;

    return (
      <Box>
        <Flex justifyContent="space-between" mb={4}>
          <Stack>
            <Text>ID: {id}</Text>
            <Text>Architecture: {arch}</Text>
            <Text>Cache Path: {cachePath}</Text>
            <Text>IP: {ip}</Text>
            <Text>Number of CPUs: {numCPU}</Text>
            <Text>Operating System: {os}</Text>
            <Text>Port: {port}</Text>
          </Stack>
        </Flex>
      </Box>
    );
  }
}

export class OShowType extends React.Component {
  render() {
    var btnContent = <></>;
    switch (this.props.pcType) {
      case "dataCache":
        btnContent = <FaDatabase />;
        break;
      case undefined:
        btnContent = <p>undefined</p>;
        break;
      case null:
        btnContent = <p>null</p>;
        break;
      default:
        btnContent = <p>Unknown</p>;
        break;
    }
    return <Button>{btnContent}</Button>;
  }
}

export class OFunction extends React.Component {
  showBtnsDataCache() {
    switch (this.props.pcType) {
      case "dataCache":
        return <FaFolder />;
      case undefined:
        return <p>undefined</p>;
      case null:
        return <p>null</p>;
    }
    return <p>Unknown</p>;
  }

  render() {
    return this.showBtnsDataCache();
  }
}

// Define a class for the file manager
export class OFileManager extends React.Component {
  constructor(props) {
    super(props);
    // Initialize state with a path and file system items
    this.state = {
      reqPath: "",
      path: "Home > Documents",
      items: [],
      txtFolderName: "",
    };
  }

  componentDidMount() {
    //console.log(this.props.uuid);
    this.refreshPath("/path");
  }

  setMainProject(itemName, itemType) {
    if (itemType != "file") {
      try{
        const message = {
          type: "setCurrentProjectPath",
          data: JSON.stringify({
            uuid: this.props.uuid,
            setProjectPath: this.props.podPath.path + "/" + itemName,
          }),
        };
        this.props.ws.send(JSON.stringify(message));
        this.props.refreshADataPodConfig(this.props.uuid);
      }catch(ex){
        console.log("Unable to set new config",ex);
      }
      
    }
  }

  refreshPath(path) {
    const message = {
      type: "reqPathFromCache",
      data: JSON.stringify({
        path: path,
        uuid: this.props.uuid,
      }),
    };
    this.props.ws.send(JSON.stringify(message));
  }

  txtCreateFolderName = (event) => {
    this.setState({ txtFolderName: event.target.value });
  };

  createFolder() {
    const { txtFolderName } = this.state;
    const message = {
      type: "createFolderForCache",
      data: JSON.stringify({
        path: this.props.podPath.path + "/" + txtFolderName,
        uuid: this.props.uuid,
      }),
    };
    if (txtFolderName != "") {
      this.props.ws.send(JSON.stringify(message));
    }
  }

  backBtn() {
    if (this.props.podPath.path.includes("/")) {
      const segments = this.props.podPath.path.split("/");
      segments.pop(); // Remove the last segment
      var tmp = segments.join("/");
      this.refreshPath(tmp);
    }
  }

  menuOpen(itemName, itemType) {
    if (itemType != "file") {
      this.refreshPath(this.props.podPath.path + "/" + itemName);
    }else{
      var tmpNewPath = this.props.podPath.path.replace("/path","/files") +"/" +this.props.uuid + "/";
      var fullPath = "http://" + this.props.currentHost  +":4124"+tmpNewPath+itemName;
      window.open(fullPath, '_blank');
    }
  }

  render() {
    const { path, items, txtFolderName } = this.state;

    return (
      <Box p={5} borderWidth="1px" borderRadius="lg">
        {/* Path */}
        {this.props.podPath ? (
          <Box>
            <InputGroup>
              <Button onClick={() => this.refreshPath(this.props.podPath.path)}>
                <RepeatIcon />
              </Button>
              <Text mb={4} fontSize="lg" fontWeight="bold">
                <InputGroup>
                  <InputLeftAddon>{this.props.podPath.path}</InputLeftAddon>
                  <Input
                    value={this.state.reqPath}
                    onChange={(e) => this.setState({ reqPath: e.target.value })}
                    placeholder="Enter text"
                  />
                </InputGroup>
              </Text>
              <Button onClick={() => this.refreshPath(this.state.reqPath)}>
                Go
              </Button>
              <Button onClick={() => this.backBtn()}>Back</Button>
              <InputLeftAddon>Create</InputLeftAddon>
              <ButtonGroup>
                <ODrawer
                  header={"Create folder"}
                  content={
                    <Stack>
                      <InputGroup>
                        <InputLeftAddon>Folder name</InputLeftAddon>
                        <Input
                          value={txtFolderName}
                          onChange={this.txtCreateFolderName}
                          placeholder="Enter text"
                        />
                      </InputGroup>
                      <HStack>
                        <Spacer />
                        <Button onClick={() => this.createFolder()}>
                          Create
                        </Button>
                      </HStack>
                    </Stack>
                  }
                  btnOpenText={"Folder"}
                  placement={"top"}
                />
              </ButtonGroup>
            </InputGroup>

            {/* File System Items */}
            <Wrap gap={2}>
              {this.props.podPath.contents ? (
                <>
                  {this.props.podPath.contents.map((item, index) => (
                    <WrapItem
                      key={index}
                      align="center"
                      p={2}
                      _hover={{ bg: "blue.100" }}
                    >
                      <Menu>
                        <MenuButton
                          as={Button}
                          h="70px"
                          rightIcon={<ChevronDownIcon />}
                        >
                          <Icon
                            as={item.type === "file" ? FiFileText : FiFolder}
                            w={6}
                            h={6}
                            mr={2}
                          />
                          <Text>{item.name}</Text>
                          <Text>{item.size}</Text>
                        </MenuButton>
                        <MenuList>
                          <MenuItem
                            onClick={() => this.menuOpen(item.name, item.type)}
                          >
                            Open
                          </MenuItem>
                          <MenuItem
                            onClick={() =>
                              this.setMainProject(item.name, item.type)
                            }
                          >
                            Set as main project
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </WrapItem>
                  ))}
                </>
              ) : (
                <p>Folder is empty</p>
              )}
            </Wrap>
          </Box>
        ) : null}
      </Box>
    );
  }
}

//------------chakra

export class ODrawer extends React.Component {
  state = { isOpen: false };

  onClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { isOpen } = this.state;

    return (
      <>
        <Button
          size={this.props.btnSize}
          onClick={() => this.setState({ isOpen: true })}
        >
          {this.props.btnOpenText}
        </Button>

        <Drawer
          placement={this.props.placement}
          isOpen={isOpen}
          onClose={this.onClose}
          size={this.props.size}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>{this.props.header}</DrawerHeader>
            <DrawerBody>{this.props.content}</DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
}
