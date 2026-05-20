import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../database/supabaseconfig";

const caracteristicas = [
  {
    icon: "bi-qr-code-scan",
    titulo: "Escanea y Ordena",
    descripcion: "Escanea el código QR de tu mesa y realiza tu pedido al instante.",
  },
  {
    icon: "bi-phone",
    titulo: "Menú Digital",
    descripcion: "Navega por nuestro menú completo con fotos y descripciones.",
  },
  {
    icon: "bi-credit-card",
    titulo: "Pago Fácil",
    descripcion: "Paga con efectivo o tarjeta de forma segura y rápida.",
  },
];

export default function Inicio() {
  const [visible, setVisible] = useState(false);
  const [sesionActiva, setSesionActiva] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [scannerIniciado, setScannerIniciado] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase.auth.getSession();
      setSesionActiva(!!data?.session);
    };
    verificar();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesionActiva(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Iniciar el escáner con la cámara trasera forzada
  useEffect(() => {
    if (!mostrarScanner) {
      if (scannerRef.current && scannerIniciado) {
        scannerRef.current.stop().catch((err) => console.warn("Error al detener escáner:", err));
        setScannerIniciado(false);
        setCamaraActiva(false);
      }
      return;
    }

    const iniciarScanner = async () => {
      const elementId = "qr-reader";
      const readerElement = document.getElementById(elementId);
      if (!readerElement) return;

      try {
        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        // Configuración del área de escaneo
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        // Forzar el uso de la cámara trasera en dispositivos móviles
        // facingMode: "environment" = cámara trasera
        await html5QrCode.start(
          { facingMode: "environment" }, // Solo cámara trasera
          config,
          (decodedText) => {
            // QR leído correctamente
            html5QrCode.stop().catch((e) => console.warn(e));
            setScannerIniciado(false);
            setCamaraActiva(false);
            setMostrarScanner(false);

            // Procesar el contenido del QR
            let mesa = decodedText.trim();
            if (mesa.includes("=")) {
              mesa = mesa.split("=")[1]?.trim();
            }
            if (mesa && !isNaN(parseInt(mesa))) {
              navigate(`/menu/${mesa}`);
            } else {
              alert("El QR no contiene un número de mesa válido.");
            }
          },
          (errorMessage) => {
            // No mostrar errores de escaneo continuo (son normales)
          }
        );
        setScannerIniciado(true);
        setCamaraActiva(true);
      } catch (err) {
        console.error("Error al iniciar la cámara trasera:", err);
        alert("No se pudo acceder a la cámara trasera. Verifica los permisos.");
        setMostrarScanner(false);
      }
    };

    iniciarScanner();

    return () => {
      if (scannerRef.current && scannerIniciado) {
        scannerRef.current.stop().catch((e) => console.warn(e));
      }
    };
  }, [mostrarScanner, navigate]);

  const cerrarScanner = () => {
    if (scannerRef.current && scannerIniciado) {
      scannerRef.current.stop().catch((e) => console.warn(e));
    }
    setMostrarScanner(false);
    setScannerIniciado(false);
    setCamaraActiva(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6f0", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        .fade-up {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .fade-up.show {
          opacity: 1;
          transform: translateY(0);
        }
        .btn-outline-dark-custom {
          background: transparent;
          color: #0c0c2c;
          border: 2px solid #0c0c2c;
          padding: 10px 22px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.92rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .btn-outline-dark-custom:hover {
          background: #0c0c2c;
          color: white;
        }
        .btn-outline-orange-custom {
          background: transparent;
          color: #ff6a00;
          border: 2px solid #ff6a00;
          padding: 10px 22px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.92rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .btn-outline-orange-custom:hover {
          background: #ff6a00;
          color: white;
        }
        .feature-card {
          background: white;
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          flex: 1;
          min-width: 180px;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.10);
        }
        .feature-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255,106,0,0.1);
          color: #ff6a00;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.7rem;
          margin: 0 auto 18px;
        }
        .scanner-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .scanner-box {
          width: 90%;
          max-width: 400px;
          background: #000;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
        }
        .scanner-header {
          display: flex;
          justify-content: flex-end;
          padding: 10px;
        }
        .close-scanner {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-scanner:hover {
          background: rgba(255,255,255,0.4);
        }
        .scanner-message {
          text-align: center;
          color: white;
          margin-top: 20px;
          margin-bottom: 20px;
          font-size: 14px;
        }
      `}</style>

      {/* HERO */}
      <div
        className={`fade-up ${visible ? "show" : ""}`}
        style={{
          textAlign: "center",
          padding: "72px 24px 48px",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontWeight: 800, fontSize: "2.6rem", color: "#0c0c2c", marginBottom: 14, lineHeight: 1.2 }}>
          Ordena con un <span style={{ color: "#ff6a00" }}>Tap</span>
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1.05rem", marginBottom: 32, lineHeight: 1.7 }}>
          Pide tu comida favorita de manera rápida y sencilla
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-outline-dark-custom" onClick={() => navigate("/menu")}>
            <i className="bi bi-phone" /> Ver Menú
          </button>
          <button className="btn-outline-orange-custom" onClick={() => setMostrarScanner(true)}>
            <i className="bi bi-qr-code-scan" /> Escanear Mesa
          </button>
        </div>
      </div>

      {/* TARJETAS DE CARACTERÍSTICAS */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px", display: "flex", gap: 20, flexWrap: "wrap" }}>
        {caracteristicas.map((c, i) => (
          <div
            key={i}
            className={`feature-card fade-up ${visible ? "show" : ""}`}
            style={{ transitionDelay: `${200 + i * 90}ms` }}
          >
            <div className="feature-icon">
              <i className={`bi ${c.icon}`} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#0c0c2c", marginBottom: 10 }}>{c.titulo}</h3>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0, lineHeight: 1.6 }}>{c.descripcion}</p>
          </div>
        ))}
      </div>

      {/* MODAL DEL ESCÁNER - SOLO CÁMARA TRASERA */}
      {mostrarScanner && (
        <div className="scanner-container">
          <div className="scanner-box">
            <div className="scanner-header">
              <button className="close-scanner" onClick={cerrarScanner}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div id="qr-reader" style={{ width: "100%", margin: "0 auto" }}></div>
            <div className="scanner-message">
              {camaraActiva
                ? "📷 Apunta al código QR de la mesa (cámara trasera)"
                : "⏳ Solicitando acceso a la cámara trasera..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}