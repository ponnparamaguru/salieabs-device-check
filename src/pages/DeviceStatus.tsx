//@ts-nocheck
import { useEffect, useState } from "react";
import { Power, Loader2, Wifi, WifiOff, Server, Zap } from "lucide-react";
import logo from "../assets/logo.png";
import './DeviceStatus.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL!;
const DEVICE_ID = "GS2526002";

const MqttStatus = () => {
  const [status, setStatus] = useState<"ON" | "OFF" | "No Response" | "Idle" | "Checking...">("Idle");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connected");
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<string | null>(null);

  const checkDeviceStatus = async () => {
    setChecking(true);
    setStatus("Checking...");

    try {
      const response = await fetch(`${API_BASE_URL}/devices/${DEVICE_ID}`);
      if (!response.ok) {
        setStatus("No Response");
        setLastPing(null);
      } else {
        const data = await response.json();
        setStatus(data?.online ? "ON" : "OFF");
        setLastPing(new Date(data?.last_ping).toLocaleString());
      }
    } catch (err) {
      console.error("API error:", err);
      setStatus("No Response");
      setLastPing(null);
    }

    setLastChecked(new Date().toLocaleTimeString());
    setChecking(false);
  };

  // ✅ Fetch once on load + every 5 seconds
  useEffect(() => {
    checkDeviceStatus(); // Initial fetch

    const interval = setInterval(() => {
      checkDeviceStatus();
    }, 5000); // 5000ms = 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

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
          <p className="header-subtitle">API IoT Device Status Monitor</p>
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
            onClick={checkDeviceStatus}
            disabled={checking}
            className={`check-button ${checking ? "checking" : ""}`}
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
              <div className="info-label">Device ID:</div>
              <div className="info-value">{DEVICE_ID}</div>
              <div className="info-label">Last Ping:</div>
              <div className="info-value">{lastPing || "—"}</div>
            </div>
          </div>
        </div>

        <div className="mqtt-footer">
          <p>Last checked: {lastChecked || "Not yet checked"}</p>
        </div>
      </div>
    </div>
  );
};

export default MqttStatus;
