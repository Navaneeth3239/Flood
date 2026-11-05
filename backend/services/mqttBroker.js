import { Aedes } from 'aedes';
import { createServer } from 'node:net';

let brokerInstance = null;
let tcpServer = null;
let brokerPort = 1883;
let connectedClientsCount = 0;
let totalMessagesReceived = 0;
let lastReceivedMessage = null;

export async function startMqttBroker(port = 1883) {
  try {
    brokerInstance = await Aedes.createBroker();
    tcpServer = createServer(brokerInstance.handle);
    brokerPort = port;

    brokerInstance.on('client', (client) => {
      connectedClientsCount++;
      console.log(`[MQTT-BROKER] Client connected: ${client.id} (Total: ${connectedClientsCount})`);
    });

    brokerInstance.on('clientDisconnect', (client) => {
      connectedClientsCount = Math.max(0, connectedClientsCount - 1);
      console.log(`[MQTT-BROKER] Client disconnected: ${client.id} (Total: ${connectedClientsCount})`);
    });

    brokerInstance.on('publish', (packet, client) => {
      if (packet.topic && !packet.topic.startsWith('$SYS')) {
        totalMessagesReceived++;
        const payloadStr = packet.payload ? packet.payload.toString() : '';
        lastReceivedMessage = {
          topic: packet.topic,
          payload: payloadStr.slice(0, 200),
          clientId: client ? client.id : 'internal',
          timestamp: new Date().toISOString(),
        };
      }
    });

    return new Promise((resolve) => {
      tcpServer.on('error', async (err) => {
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          console.warn(`[MQTT-BROKER] Port ${port} unavailable (${err.code}), attempting fallback to 1884...`);
          if (port === 1883) {
            const res = await startMqttBroker(1884);
            resolve(res);
          } else {
            console.error('[MQTT-BROKER] Failed to bind MQTT broker to port 1884 as well:', err);
            resolve(false);
          }
        } else {
          console.error('[MQTT-BROKER] TCP Server error:', err);
          resolve(false);
        }
      });

      tcpServer.listen(brokerPort, '127.0.0.1', () => {
        console.log(`[MQTT-BROKER] Embedded MQTT Broker listening on mqtt://127.0.0.1:${brokerPort}`);
        resolve(true);
      });
    });
  } catch (e) {
    console.error('[MQTT-BROKER] Initialization error:', e);
    return false;
  }
}

export function getBrokerStats() {
  return {
    running: !!tcpServer && tcpServer.listening,
    port: brokerPort,
    host: '127.0.0.1',
    connectedClients: connectedClientsCount,
    totalMessages: totalMessagesReceived,
    lastMessage: lastReceivedMessage,
  };
}

export function closeMqttBroker() {
  if (tcpServer) {
    tcpServer.close();
  }
}
