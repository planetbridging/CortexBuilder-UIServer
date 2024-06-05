class OFFNN {
    constructor(networkConfig) {
      this.networkConfig = networkConfig;
      this.neurons = {};
    }
  
    activate(activationType, input) {
      switch (activationType) {
        case "relu":
          return Math.max(0, input);
        case "sigmoid":
          return 1 / (1 + Math.exp(-input));
        case "tanh":
          return Math.tanh(input);
        case "softmax":
          // Softmax is typically applied across a layer of neurons, but for a single input:
          return Math.exp(input); // Should normalize later in the layer processing
        case "leaky_relu":
          return input > 0 ? input : 0.01 * input;
        case "swish":
          return input * (1 / (1 + Math.exp(-input))); // Beta set to 1 for simplicity
        case "elu":
          const alpha = 1.0; // Alpha can be adjusted based on specific needs
          return input >= 0 ? input : alpha * (Math.exp(input) - 1);
        case "selu":
          const lambda = 1.0507; // Scale factor
          const alphaSELU = 1.67326; // Alpha for SELU
          return input >= 0
            ? lambda * input
            : lambda * (alphaSELU * (Math.exp(input) - 1));
        case "softplus":
          return Math.log(1 + Math.exp(input));
        default:
          return input; // Linear activation (no change)
      }
    }
  
    feedforward(inputValues) {
      // Initialize input layer neurons with input values
      for (let inputId in this.networkConfig.layers.input.neurons) {
        this.neurons[inputId] = inputValues[inputId];
      }
  
      console.log("-----------this.neurons----------");
      console.log(this.neurons);
  
      // Process hidden layers
      for (let layer of this.networkConfig.layers.hidden) {
        for (let nodeId in layer.neurons) {
          const node = layer.neurons[nodeId];
          let sum = 0;
          for (let inputId in node.connections) {
            const connection = node.connections[inputId];
            sum += this.neurons[inputId] * connection.weight;
          }
          sum += node.bias;
          this.neurons[nodeId] = this.activate(node.activationType, sum);
  
          console.log("-----------this.neurons" + nodeId + "----------");
          console.log(this.neurons);
        }
      }
  
      // Process output layer
      const outputs = {};
      for (let nodeId in this.networkConfig.layers.output.neurons) {
        const node = this.networkConfig.layers.output.neurons[nodeId];
        let sum = 0;
        for (let inputId in node.connections) {
          const connection = node.connections[inputId];
          sum += this.neurons[inputId] * connection.weight;
        }
        sum += node.bias;
        outputs[nodeId] = this.activate(node.activationType, sum);
      }
  
      return outputs;
    }
  }
  
  module.exports = {
    OFFNN,
  };
  