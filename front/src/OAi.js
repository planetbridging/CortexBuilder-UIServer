import { Button, ButtonGroup, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { RepeatIcon } from "@chakra-ui/icons";

class OAi extends React.Component {
  state = {
    setProjectPath: "",
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    let parsedConfig = nextProps.podConfig;
    if (typeof nextProps.podConfig === "string") {
      try {
        parsedConfig = JSON.parse(nextProps.podConfig.replace(/'/g, '"'));
      } catch (error) {
        console.error("Failed to parse podConfig:", nextProps.podConfig, error);
      }
    }

    if (
      parsedConfig &&
      parsedConfig.setProjectPath !== prevState.setProjectPath
    ) {
      return {
        setProjectPath: parsedConfig.setProjectPath,
      };
    }
    return null;
  }

  componentDidUpdate(prevProps) {
    // Check if the podConfig prop has changed
    if (prevProps.podConfig != this.props.podConfig) {
      let parsedConfig = this.props.podConfig;
      // Parse podConfig if it's a string
      if (typeof this.props.podConfig === "string") {
        try {
          parsedConfig = JSON.parse(this.props.podConfig.replace(/'/g, '"'));
        } catch (error) {
          console.error(
            "Failed to parse podConfig:",
            this.props.podConfig,
            error
          );
        }
      }

      // Update state with the new setProjectPath if it's different
      if (
        parsedConfig &&
        parsedConfig.setProjectPath !== this.state.setProjectPath
      ) {
        this.setState({ setProjectPath: parsedConfig.setProjectPath });
      }
    }
  }

  render() {
    const { setProjectPath } = this.state;
    //console.log(this.props.podConfig, this.props.podConfig?.setProjectPath);
    return (
      <Stack bg="white">
        <Text>{this.props.podSpec.ip}</Text>
        <ButtonGroup>
          
        <Button
          onClick={() => this.props.refreshADataPodConfig(this.props.uuid)}
        >
          <RepeatIcon />
        </Button>
        <Text> {setProjectPath}</Text>
        </ButtonGroup>
      
      </Stack>
    );
  }
}

export default OAi;
