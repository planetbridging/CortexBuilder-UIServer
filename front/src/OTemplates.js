import React from 'react';
import { Box, Text, Flex, Heading, Stack } from '@chakra-ui/react';

export class SystemInfo extends React.Component {
  render() {
    const { arch, cachePath, cmd, id, ip, numCPU, os, pcType, port } = this.props.systemInfo;
    const { lstDataCache, Type } = this.props.clientInfo;

    return (
      <Box>
        <Heading mb={4}>System Information</Heading>
        <Flex justifyContent="space-between" mb={4}>
          <Stack>
            <Text>Architecture: {arch}</Text>
            <Text>Cache Path: {cachePath}</Text>
            <Text>Command: {cmd}</Text>
            <Text>ID: {id}</Text>
            <Text>IP: {ip}</Text>
            <Text>Number of CPUs: {numCPU}</Text>
            <Text>Operating System: {os}</Text>
            <Text>PC Type: {pcType}</Text>
            <Text>Port: {port}</Text>
          </Stack>
          <Stack>
            <Text>Type: {Type}</Text>
            <Text>Data Cache List: {lstDataCache}</Text>
          </Stack>
        </Flex>
      </Box>
    );
  }
}

