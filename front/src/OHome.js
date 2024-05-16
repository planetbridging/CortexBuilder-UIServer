import React from "react";

class OHome extends React.Component {
  state = {
    ws: null,
    lstDataPods: [],
    lstPodSpecs: new Map()
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
    };
    ws.onmessage = (evt) => {
      const message = JSON.parse(evt.data);
      //console.log(message);
      switch (message.Type) {
        case "pong":
          console.log("received pong");
          break;
        case "getClients":
          // Parse new client data
          const lstDataPods = JSON.parse(message.lstDataCache);
 
          // Compare with current state
          this.setState({ lstDataPods: lstDataPods });
          break;          
        default:
          console.log("unknown message type:", message.Type);
          console.log(message);  
          this.mainMsgs(message);        
      }
    };

    ws.onclose = () => {
      console.log("disconnected");
    };
    this.setState({ ws: ws });
  }


  mainMsgs(msg){
    switch(msg.cmd){
      case "sysinfo":
        console.log(msg);
        var lstMpTmp = this.state.lstPodSpecs;
        if(!lstMpTmp.has(msg.id)){
          const tmpId = msg.id;
          delete msg.id;
          lstMpTmp.set(tmpId,msg);
          this.setState({lstPodSpecs: lstMpTmp});
        }
      break;
    }
  }


  render() {
    console.log(this.state.lstDataPods);
    console.log(this.state.lstPodSpecs);
    return (
      <div>
        <p>helo</p>
        {/* Display client details */}
        {this.state.lstDataPods.map((client, index) => {
          const podSpec = this.state.lstPodSpecs.get(client.uuid);
          return (
            <div key={index}>
              <p>{client.remote_addr}</p>
              <p>{client.uuid}</p>
              {podSpec && (
                <div>
                  <p>Arch: {podSpec.arch}</p>
                  <p>Cache Path: {podSpec.cachePath}</p>
                  <p>Command: {podSpec.cmd}</p>
                  <p>IP: {podSpec.ip}</p>
                  <p>Number of CPUs: {podSpec.numCPU}</p>
                  <p>OS: {podSpec.os}</p>
                  <p>PC Type: {podSpec.pcType}</p>
                  <p>Port: {podSpec.port}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}

export default OHome;
