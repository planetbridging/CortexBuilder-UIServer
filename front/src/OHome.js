import React from "react";

class OHome extends React.Component {
  state = {
    ws: null,
    clients: [],
  };

  componentDidMount() {
    const ws = new WebSocket("ws://localhost:4124/ws");
    ws.onopen = () => {
      console.log("connected");

      const message = {
        type: "ping",
        data: "",
      };
      ws.send(JSON.stringify(message));

      /*const msg2 = {
        type: "getClients",
        data: "",
      };
      ws.send(JSON.stringify(msg2));*/
      // Send getClients message every second
      this.interval = setInterval(() => {
        const msg2 = {
          type: "getClients",
          data: "",
        };
        ws.send(JSON.stringify(msg2));
      }, 1000);
    };
    ws.onmessage = (evt) => {
      const message = JSON.parse(evt.data);
      switch (message.Type) {
        case "pong":
          console.log("received pong");
          break;
        case "getClients":
          console.log(message);
          // Parse new client data
          const newClients = JSON.parse(message.lstDataCache);
          // Compare with current state
          if (
            JSON.stringify(this.state.clients) !== JSON.stringify(newClients)
          ) {
            // Update clients state if data has changed
            this.setState({ clients: newClients });
          }
          break;
        default:
          console.log("unknown message type:", message.Type);
      }
    };

    ws.onclose = () => {
      console.log("disconnected");
    };
    this.setState({ ws: ws });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div>
        <p>helo</p>
        {/* Display client details */}
        {this.state.clients.map((client, index) => (
          <div key={index}>
            <p>{client.remote_addr}</p>
          </div>
        ))}
      </div>
    );
  }
}

export default OHome;
