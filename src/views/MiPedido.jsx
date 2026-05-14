import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Alert, Badge } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";

const MiPedido = () => {
  const { idPedido } = useParams();
  const navegar = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const obtenerColorEstado = (estado) => {
    if (estado === "Pendiente") return "warning";
    if (estado === "En preparación") return "primary";
    if (estado === "Listo") return "success";
    if (estado === "Completado") return "dark";
    if (estado === "Cancelado") return "danger";
    return "secondary";
  };

  const cargarPedido = async () => {
    try {
      setCargando(true);
      setError("");

      const { data: pedidoData, error: errorPedido } = await supabase
        .from("Pedido")
        .select(`
          *,
          Mesas (
            id_mesa,
            nombre_mesa
          ),
          Tipo_pedido (
            descripcion
          )
        `)
        .eq("id_pedido", idPedido)
        .single();

      if (errorPedido) throw errorPedido;

      const { data: detallesData, error: errorDetalles } = await supabase
        .from("Detalle_pedido")
        .select(`
          *,
          Platillos (
            nombre_platillo,
            precio,
            url_imagen
          ),
          Extras (
            descripcion,
            precio
          ),
          Salsas (
            descripcion,
            precio
          )
        `)
        .eq("id_pedido", idPedido);

      if (errorDetalles) throw errorDetalles;

      setPedido(pedidoData);
      setDetalles(detallesData || []);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información del pedido.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedido();

    const canal = supabase
      .channel(`pedido-${idPedido}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Pedido",
          filter: `id_pedido=eq.${idPedido}`,
        },
        (payload) => {
          setPedido((prev) => ({
            ...prev,
            ...payload.new,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [idPedido]);

  if (cargando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="warning" />
          <p className="mt-3">Cargando tu pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: 24 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <Alert variant="danger">{error || "Pedido no encontrado."}</Alert>

          <button
            onClick={() => navegar("/")}
            className="btn btn-dark"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "32px 20px",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            background: "white",
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <h2 style={{ fontWeight: 800, color: "#0c0c2c", marginBottom: 6 }}>
                <i className="bi bi-receipt me-2" style={{ color: "#ff6a00" }} />
                Pedido #{pedido.id_pedido}
              </h2>

              <p style={{ color: "#6b7280", marginBottom: 4 }}>
                Mesa:{" "}
                <strong>
                  {pedido.Mesas?.nombre_mesa || `Mesa ${pedido.id_mesa}`}
                </strong>
              </p>

              <p style={{ color: "#6b7280", marginBottom: 0 }}>
                Pago:{" "}
                <strong>
                  {pedido.Tipo_pedido?.descripcion || "No definido"}
                </strong>
              </p>
            </div>

            <Badge
              bg={obtenerColorEstado(pedido.estado)}
              style={{ fontSize: "0.85rem", padding: "9px 12px" }}
            >
              {pedido.estado}
            </Badge>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <h5 style={{ fontWeight: 800, color: "#0c0c2c", marginBottom: 18 }}>
            Detalle del pedido
          </h5>

          {detalles.length === 0 ? (
            <Alert variant="info">Este pedido no tiene detalles registrados.</Alert>
          ) : (
            detalles.map((detalle) => {
              const precioPlatillo = parseFloat(detalle.precio_unitario || 0);
              const precioExtra = parseFloat(detalle.Extras?.precio || 0);
              const precioSalsa = parseFloat(detalle.Salsas?.precio || 0);
              const subtotal =
                (precioPlatillo + precioExtra + precioSalsa) *
                parseInt(detalle.cantidad || 1);

              return (
                <div
                  key={detalle.id_detalle || `${detalle.id_pedido}-${detalle.id_platillo}`}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 0",
                    borderBottom: "1px solid #f1f1f1",
                  }}
                >
                  <div
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#f3f4f6",
                      flexShrink: 0,
                    }}
                  >
                    {detalle.Platillos?.url_imagen ? (
                      <img
                        src={detalle.Platillos.url_imagen}
                        alt={detalle.Platillos?.nombre_platillo}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#9ca3af",
                        }}
                      >
                        <i className="bi bi-image" />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: "#0c0c2c" }}>
                      {detalle.Platillos?.nombre_platillo || "Platillo"}
                    </div>

                    <div style={{ color: "#6b7280", fontSize: "0.88rem" }}>
                      Cantidad: {detalle.cantidad}
                    </div>

                    {detalle.Extras && (
                      <div style={{ color: "#ff6a00", fontSize: "0.82rem" }}>
                        Extra: {detalle.Extras.descripcion}
                      </div>
                    )}

                    {detalle.Salsas && (
                      <div style={{ color: "#dc3545", fontSize: "0.82rem" }}>
                        Salsa: {detalle.Salsas.descripcion}
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 800, color: "#ff6a00" }}>
                    C${subtotal.toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
            marginBottom: 20,
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>Total</span>
            <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "#ff6a00" }}>
              C${parseFloat(pedido.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="d-grid gap-2">
          <button
            onClick={cargarPedido}
            className="btn btn-dark"
          >
            <i className="bi bi-arrow-clockwise me-2" />
            Actualizar estado
          </button>

          <button
            onClick={() => navegar(`/menu/${pedido.id_mesa}`)}
            className="btn btn-outline-dark"
          >
            <i className="bi bi-plus-circle me-2" />
            Hacer otro pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiPedido;