//@ts-nocheck
import { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import { Power, Loader2, Wifi, WifiOff, Server, Zap } from "lucide-react";
import logo from "../assets/logo.png";
import './DeviceStatus.css'

const MQTT_BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL!;
const TOPIC = import.meta.env.VITE_MQTT_TOPIC!;


const MqttStatus = () => {
  const [status, setStatus] = useState<"ON" | "OFF" | "No Response" | "Idle" | "Checking...">("Idle");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [checking, setChecking] = useState(false);
  const clientRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    setConnectionStatus("connecting");

    const client = mqtt.connect(MQTT_BROKER_URL, {
      keepalive: 60, // keep alive with ping every 60s
      reconnectPeriod: 5000, // try to reconnect every 5s forever
      connectTimeout: 30 * 1000, // timeout after 30s if cannot connect
    });

    clientRef.current = client;

    client.on("connect", () => {
      console.log("MQTT Connected");
      setConnectionStatus("connected");
      client.subscribe(TOPIC);
    });

    client.on("reconnect", () => {
      console.log("Reconnecting to MQTT...");
      setConnectionStatus("connecting");
    });

    client.on("offline", () => {
      console.warn("MQTT is offline. Retrying...");
      setConnectionStatus("connecting"); // Treat as reconnecting
    });

    client.on("error", (err) => {
      console.error("MQTT Error:", err?.message || err);
      setConnectionStatus("disconnected");
    });

    client.on("close", () => {
      console.log("Connection closed. Will retry...");
      // Don't setConnectionStatus here, keep retrying silently
    });

    return () => client.end();
  }, []);



  const handleCheckStatus = () => {
    if (connectionStatus !== "connected") return;
    setChecking(true);
    setStatus("Checking...");
    let foundStatus = false;

    const messageHandler = (topic: string, message: Buffer) => {
      if (topic === "test_OUT") {
        foundStatus = true;
        const payload = message.toString().trim();
        setStatus(payload === "1" ? "ON" : "OFF");
        setChecking(false); 
        clientRef.current?.off("message", messageHandler);
        clearTimeout(timeoutRef.current); 
      }
    };


    clientRef.current?.on("message", messageHandler);
    clientRef.current?.publish("test_IN", "status");

    timeoutRef.current = setTimeout(() => {
      clientRef.current?.off("message", messageHandler);
      if (!foundStatus) setStatus("No Response");
      setChecking(false);
    }, 5000);
  };

  return (
    <div className="mqtt-container">
      <div className="logo-wrapper">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <div className="mqtt-card">
        {/* Header */}
        <div className="mqtt-header">
          <div className="header-content">
            <h1>Device Checker</h1>
            <div className="connection-status">
              {connectionStatus === "connected" && <Wifi className="connection-icon connected" />}
              {connectionStatus === "disconnected" && <WifiOff className="connection-icon disconnected" />}
              {connectionStatus === "connecting" && <Loader2 className="connection-icon connecting spin" />}
              <span className={`status-text ${connectionStatus}`}>
                {connectionStatus === "connected" && "Connected"}
                {connectionStatus === "disconnected" && "Disconnected"}
                {connectionStatus === "connecting" && "Connecting..."}
              </span>
            </div>
          </div>
          <p className="header-subtitle">MQTT IoT Device Status Monitor</p>
        </div>

        {/* Status Card */}
        <div className="mqtt-content">
          <div className={`status-card ${status.toLowerCase().replace(" ", "-")}`}>
            <div className="status-icon">
              {status === "ON" && <Zap className="pulse" />}
              {status === "OFF" && <Power />}
              {status === "No Response" && <Server />}
              {status === "Idle" && <Power />}
              {status === "Checking..." && <Loader2 className="spin" />}
            </div>
            <h2 className="status-title">{status}</h2>
            <p className="status-description">
              {status === "ON" && "Device Active"}
              {status === "OFF" && "Device Inactive"}
              {status === "No Response" && "No Response"}
              {status === "Idle" && "Idle"}
              {status === "Checking..." && "Checking Status..."}
            </p>
          </div>

          <button
            onClick={handleCheckStatus}
            disabled={checking || connectionStatus !== "connected"}
            className={`check-button ${checking ? "checking" : ""} ${connectionStatus !== "connected" ? "disabled" : ""}`}
          >
            {checking ? (
              <>
                <Loader2 className="spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Power />
                <span>Check Device Status</span>
              </>
            )}
          </button>

          <div className="connection-info">
            <h3>Connection Info</h3>
            <div className="info-grid">
              <div className="info-label">Device Name:</div>
              <div className="info-value">Device 001</div>
              <div className="info-label">Device ID:</div>
              <div className="info-value">DEV2501</div>
            </div>
          </div>
        </div>

        <div className="mqtt-footer">
          <p>Last checked: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default MqttStatus;
