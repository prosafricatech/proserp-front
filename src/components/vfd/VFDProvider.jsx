// components/vfd/VFDProvider.jsx
"use client";

import { createContext, useContext, useRef, useState, useEffect } from "react";

const VFDContext = createContext(null);

export function VFDProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const portRef = useRef(null);
  const writerRef = useRef(null);
  const readerRef = useRef(null);
  const autoConnectEnabled = useRef(true);
  const displayTimeoutRef = useRef(null);

  // DISPLAY TOTAL – DEBOUNCED & SAFE
  async function displayTotal(amount = 0, currency = "TZS") {
    if (!writerRef.current || !connected) return;

    if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);

    displayTimeoutRef.current = setTimeout(async () => {
      if (!writerRef.current || !connected) return;

      try {
        const encoder = new TextEncoder();
        const formatted = Number(amount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        await writerRef.current.write(encoder.encode("\x0C"));
        await new Promise(r => setTimeout(r, 80));

        const line1 = "TOTAL:";
        const line2 = `${currency} ${formatted}`.padStart(20, " ");

        await writerRef.current.write(encoder.encode(line1 + "\r\n"));
        await writerRef.current.write(encoder.encode(line2 + "\r\n"));

      } catch (e) {
        console.warn("VFD write failed:", e);
        setConnected(false);
        await cleanup();
      } finally {
        displayTimeoutRef.current = null;
      }
    }, 100);
  }

  async function sendZero(currency = "TZS") {
    await displayTotal(0, currency);
  }

  async function sendLine(text) {
    if (!writerRef.current || !connected) return;
    try {
      await writerRef.current.write(new TextEncoder().encode(text + "\r\n"));
    } catch {}
  }

  // CLEANUP – NO TAB CRASH!
  async function cleanup() {
    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }

    try {
      if (readerRef.current) {
        try { await readerRef.current.cancel(); } catch {}
        try { readerRef.current.releaseLock(); } catch {}
        readerRef.current = null;
      }
      if (writerRef.current) {
        try { writerRef.current.releaseLock(); } catch {}
        writerRef.current = null;
      }
      if (portRef.current) {
        try { await portRef.current.close(); } catch {}
        portRef.current = null;
      }
    } catch {}
  }

  // OPEN PORT – THE ONLY VERSION THAT WORKS ON WINDOWS + MAC
  async function openPort(port) {
    await cleanup();

    try {
      // CRITICAL: On Windows → readable/writable are null → MUST open
      // On macOS → readable/writable exist → DO NOT open again
      const isAlreadyOpen = port.readable !== null && port.writable !== null;

      if (!isAlreadyOpen) {
        console.log("Opening VFD port (9600 baud)...");
        await port.open({ baudRate: 9600 });
      } else {
        console.log("Reusing already open VFD port");
      }

      // Always get fresh writer/reader
      writerRef.current = port.writable.getWriter();
      readerRef.current = port.readable.getReader();

      portRef.current = port;
      setConnected(true);

      // Listen for unplug
      port.addEventListener("disconnect", () => {
        console.log("VFD cable unplugged");
        setConnected(false);
        cleanup();
      });

      await sendZero();
      console.log("VFD CONNECTED!");

    } catch (e) {
      console.warn("Open failed (will retry):", e.message);
      setConnected(false);
    }
  }

  // MANUAL CONNECT – WITH FILTERS (WORKS ON WINDOWS!)
  async function connect() {
    try {
      const port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x067B }, // Prolific
          { usbVendorId: 0x1A86 }, // CH340
          { usbVendorId: 0x0403 }, // FTDI
          { usbVendorId: 0x10C4 }, // CP210x
        ]
      });
      autoConnectEnabled.current = true;
      await openPort(port);
    } catch (e) {
      if (e.name !== "NotFoundError") console.error("Connect error:", e);
    }
  }

  async function disconnect() {
    autoConnectEnabled.current = false;
    await sendZero();
    await cleanup();
    setConnected(false);
  }

  // AUTO-RECONNECT LOOP
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!autoConnectEnabled?.current || connected) return;
      try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          await openPort(ports[0]);
        }
      } catch {}
    }, 1200);
    return () => clearInterval(interval);
  }, [connected]);

    // AUTO CONNECT ON PAGE LOAD
    useEffect(() => {
        if (autoConnectEnabled) {
            autoConnectEnabled.current = true;
        }

        navigator?.serial?.getPorts?.().then(ports => {
            if (ports.length > 0) {
            openPort(ports[0]);
            }
        });

        return () => cleanup();
    }, []);

  return (
    <VFDContext.Provider value={{
      connected,
      connect,
      disconnect,
      displayTotal,
      sendZero,
      sendLine
    }}>
      {children}
    </VFDContext.Provider>
  );
}

export const useVFD = () => useContext(VFDContext);