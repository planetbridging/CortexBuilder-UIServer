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
  Icon, Menu, MenuButton, MenuList, MenuItem
} from "@chakra-ui/react";

import { FaDatabase } from "react-icons/fa6";
import { FaFolder } from "react-icons/fa";
import { FiFolder, FiFileText } from "react-icons/fi";
import { ChevronDownIcon } from "@chakra-ui/icons";


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

// Define a class for the file system item
class FileSystemItem {
  constructor(name, icon) {
    this.name = name;
    this.icon = icon;
  }
}

// Define a class for the file manager
export class OFileManager extends React.Component {
  constructor(props) {
    super(props);
    // Initialize state with a path and file system items
    this.state = {
      path: "Home > Documents",
      items: [
        //new FileSystemItem("Folder 1", FiFolder),
        //new FileSystemItem("File 1.txt", FiFileText),
        // ... add more items
      ],
    };
  }

  componentDidMount() {
    console.log(this.props.uuid);
    const message = {
      type: "reqPathFromCache",
      data: JSON.stringify({
        path: "/path",
        uuid: this.props.uuid,
      }),
    };
    this.props.ws.send(JSON.stringify(message));
  }

  

  render() {
    const { path, items } = this.state;
    console.log(this.props.podPath);
    return (
      <Box p={5} borderWidth="1px" borderRadius="lg">
        {/* Path */}
        <Text mb={4} fontSize="lg" fontWeight="bold">
          {path}
        </Text>

        {/* File System Items */}
        <Flex direction="column" gap={2}>
        {this.props.podPath && this.props.podPath.contents.map((item, index) => (
          <Flex key={index} align="center" p={2} _hover={{ bg: "gray.100" }}>
           
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              <Icon as={item.type === "file" ? FiFileText : FiFolder} w={6} h={6} mr={2} />
              <Text>{item.name}</Text>
              <Text>{item.size}</Text>
              </MenuButton>
              <MenuList>
                <MenuItem>Open</MenuItem>
                <MenuItem>Details</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        ))}
      </Flex>

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
