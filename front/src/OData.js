import React from "react";
import axios from "axios";
import {
  Box,
  Button,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Input,
  Text,
  VStack,
  SimpleGrid,
  Spacer,
  Flex,
} from "@chakra-ui/react";

class OData extends React.Component {
  state = {
    data: [],
    startIndex: 0,
    jumpToRow: "",
  };

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    const { dataPath, dataIp } = this.props;
    const { startIndex } = this.state;
    const data = [];
    for (let i = 0; i < 100; i++) {
      const index = startIndex + i;
      var link = `http://${this.props.currentHost}:4124/row/${dataIp}/?path=${dataPath}&index=${index}`;
      const response = await axios.get(link);
      data.push(response.data);
    }
    this.setState({ data });
  };

  handlePrev = () => {
    this.setState(
      (prevState) => ({ startIndex: Math.max(prevState.startIndex - 100, 0) }),
      this.fetchData
    );
  };

  handleNext = () => {
    this.setState(
      (prevState) => ({ startIndex: prevState.startIndex + 100 }),
      this.fetchData
    );
  };

  handleJumpToRow = () => {
    const { jumpToRow } = this.state;
    const rowIndex = parseInt(jumpToRow, 10);
    if (!isNaN(rowIndex)) {
      this.setState({ startIndex: rowIndex }, this.fetchData);
    }
  };

  render() {
    const { dataSpecs, dataPath } = this.props;
    const { data, startIndex, jumpToRow } = this.state;

    // Find the object in dataSpecs where the path matches dataPath
    const dataSpec = dataSpecs.find((spec) => spec.path === dataPath);

    // If a matching object is found, display its details
    if (dataSpec) {
      return (
        <Box>
          <Box mb={4}>
            <Box as="strong">
              <strong>Columns:</strong> {dataSpec.cols.join(", ")}
            </Box>
          </Box>
          <Box mb={4}>
            <Box as="strong">
              <strong>Row Count:</strong> {dataSpec.rowCount}
            </Box>
          </Box>

          <Box d="flex" alignItems="center" mb={4}>
            <Flex w="100%">
              <Button
                colorScheme="teal"
                variant="outline"
                onClick={this.handlePrev}
              >
                Previous
              </Button>
              <Spacer />
              <Box>
                <Text mr={2}>
                  Row: {startIndex + 1} - {startIndex + data.length} /{" "}
                  {dataSpec.rowCount}
                </Text>
                <Input
                  value={jumpToRow}
                  onChange={(e) => this.setState({ jumpToRow: e.target.value })}
                  placeholder="Jump to row"
                  size="sm"
                  width="100px"
                  mr={2}
                />
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={this.handleJumpToRow}
                >
                  Go
                </Button>
              </Box>
              <Spacer />
              <Button
                colorScheme="teal"
                variant="outline"
                onClick={this.handleNext}
              >
                Next
              </Button>
            </Flex>
          </Box>

          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={dataSpec.cols.length} spacing={2}>
              {dataSpec.cols.map((col, index) => (
                <Box key={index} fontWeight="bold">
                  {col}
                </Box>
              ))}
            </SimpleGrid>
            <Box
              css={{ maxHeight: "50vh", overflowY: "scroll" }}
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
            >
              {data.map((row, index) => (
                <SimpleGrid key={index} columns={row.length} spacing={2}>
                  {row.map((cell, index) => (
                    <Box key={index}>{cell}</Box>
                  ))}
                </SimpleGrid>
              ))}
            </Box>
          </VStack>
        </Box>
      );
    }

    return <Box>No data found for the given path.</Box>;
  }
}

export default OData;
