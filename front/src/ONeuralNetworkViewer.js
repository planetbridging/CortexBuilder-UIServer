import React, { Component } from 'react';
import cytoscape from 'cytoscape';

class ONeuralNetworkViewer extends Component {
  constructor(props) {
    super(props);
    this.cyRef = React.createRef(); // Reference to the div where the graph will be mounted
  }

  componentDidMount() {
    this.cy = cytoscape({
      container: this.cyRef.current,
      elements: this.transformToCytoscapeElements(this.props.network),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(label)',
            'text-valign': 'center',
            'color': '#fff',
            'text-outline-width': 2,
            'text-outline-color': '#888'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'text-rotation': 'autorotate'
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 10
      }
    });
  }

  OldtransformToCytoscapeElements(network) {
    const elements = [];
    const { input, hidden, output } = network.layers;

    // Helper function to add neurons as nodes
    const addNodes = (neurons, group) => {
      for (const id in neurons) {
        elements.push({
          data: { id, label: `${group} ${id}` }
        });
        const neuron = neurons[id];
        if (neuron.connections) {
          for (const targetId in neuron.connections) {
            elements.push({
              data: {
                source: id,
                target: targetId,
                label: `weight: ${neuron.connections[targetId].weight.toFixed(2)}`
              }
            });
          }
        }
      }
    };

    // Add input neurons
    addNodes(input.neurons, 'Input');

    // Add hidden neurons
    hidden.forEach(layer => {
      addNodes(layer.neurons, 'Hidden');
    });

    // Add output neurons
    addNodes(output.neurons, 'Output');

    return elements;
  }

  transformToCytoscapeElements(network) {
    const elements = [];
    const { input, hidden, output } = network.layers;

    // Helper function to add neurons as nodes
    const addNodes = (neurons, group) => {
      for (const id in neurons) {
        elements.push({
          data: { id, label: `${group} ${id}` }
        });
      }
    };

    // Function to add edges reversed
    const addEdges = (neurons) => {
      for (const id in neurons) {
        const neuron = neurons[id];
        if (neuron.connections) {
          for (const targetId in neuron.connections) {
            elements.push({
              data: {
                source: targetId,  // Reversed: now the connection starts from the target
                target: id,        // And ends at the current neuron
                label: `weight: ${neuron.connections[targetId].weight.toFixed(2)}`
              }
            });
          }
        }
      }
    };

    // Add nodes first
    addNodes(input.neurons, 'Input');
    hidden.forEach(layer => {
      addNodes(layer.neurons, 'Hidden');
    });
    addNodes(output.neurons, 'Output');

    // Then add edges, reversed
    addEdges(input.neurons);
    hidden.forEach(layer => {
      addEdges(layer.neurons);
    });
    addEdges(output.neurons);

    return elements;
  }


  componentWillUnmount() {
    this.cy.destroy(); // Clean up the Cytoscape instance on unmount
  }

  render() {
    return <div ref={this.cyRef} style={{ width: '80vw', height: '80vh' }} />;
  }
}

export default ONeuralNetworkViewer;