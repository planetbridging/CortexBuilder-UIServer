import React from "react";

class OHome extends React.Component {
  state = {
    ws: null,
    lstPods: [],
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

      /* const msg2 = {
        type: "getClients",
        data: "",
      };
      ws.send(JSON.stringify(msg2));*/
      // Send getClients message every second
      /*this.interval = setInterval(() => {
        const msg2 = {
          type: "getClients",
          data: "",
        };
        ws.send(JSON.stringify(msg2));
      }, 1000);*/
    };
    ws.onmessage = (evt) => {
      const message = JSON.parse(evt.data);
      //console.log(message);
      switch (message.Type) {
        case "pong":
          console.log("received pong");
          break;
        case "getClients":
          //console.log(message);
          // Parse new client data
          const lstPods = JSON.parse(message.lstDataCache);
          // Compare with current state
          if (
            JSON.stringify(this.state.lstPods) !==
            JSON.stringify(lstPods)
          ) {
            // Update clients state if data has changed
            this.setState({ lstPods: lstPods });
          }
          break;
        default:
          console.log("unknown message type:", message.Type);
          console.log(message);
          try{
            var j = message;
            const keys = Object.keys(j);
            if(keys.includes("id")){
              console.log(this.state.lstPods);
            }
            console.log(keys);
          }catch(ex){
            console.log(ex);
          }
          
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
        {this.state.lstPods.map((client, index) => (
          <div key={index}>
            <p>{client.remote_addr}</p>
          </div>
        ))}
      </div>
    );
  }
}

export default OHome;
