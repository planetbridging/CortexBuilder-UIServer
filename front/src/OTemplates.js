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
import { FaProjectDiagram } from "react-icons/fa";

export class OSystemInfo extends React.Component {
  render() {
    const { os,ram,cpu,ip} =
      this.props;

    return (
      <Box>
        <Flex justifyContent="space-between" mb={4}>
          <Stack>
            <Text>IP: {ip}</Text>
            <Text>Operating System: {os}</Text>
            <Text>Ram: {ram}</Text>
            <Text>CPU: {cpu}</Text>
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
      case "data":
        btnContent = <FaDatabase />;
        break;
      case "ai":
        btnContent = <FaProjectDiagram/>
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
    return btnContent;
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
