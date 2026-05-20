// views/Carrito.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import { useCarrito } from "../components/contexto/CarritoContexto";

const SIN_COMPLEMENTOS = ["frappés", "bebidas", "postres", "licores"];
const CON_SALSAS = ["comidas", "alitas"];

const Carrito = () => {
  const {
    carrito, aumentarCantidad, disminuirCantidad,
    eliminarDelCarrito, actualizarExtra, actualizarSalsa,
    limpiarCarrito, totalCarrito,
  } = useCarrito();

  const [tipoPago, setTipoPago] = useState("Efectivo");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [todosExtras, setTodosExtras] = useState([]);
  const [todasSalsas, setTodasSalsas] = useState([]);
  const [itemExpandido, setItemExpandido] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarComplementos = async () => {
      const [resExtras, resSalsas] = await Promise.all([
        supabase.from("Extras").select("*").order("descripcion"),
        supabase.from("Salsas").select("*").order("descripcion"),
      ]);
      if (resExtras.data) setTodosExtras(resExtras.data);
      if (resSalsas.data) setTodasSalsas(resSalsas.data);
    };
    cargarComplementos();
  }, []);

  const calcularSubtotalItem = (item) => {
    const precioExtra = item.extraSeleccionado ? parseFloat(item.extraSeleccionado.precio || 0) : 0;
    const precioSalsa = item.salsaSeleccionada ? parseFloat(item.salsaSeleccionada.precio || 0) : 0;
    return (parseFloat(item.precio || 0) + precioExtra + precioSalsa) * item.cantidad;
  };

  const procederPago = async () => {
    if (carrito.length === 0) return;
    setError(null);
    setProcesando(true);

    try {
      const mesaId = carrito[0]?.id_mesa || null;
      const modoPOS = localStorage.getItem("modoPOS");

      let authUserId = null;
      let idCliente = null; // Para modo POS seguimos usando tabla Clientes (opcional)

      if (modoPOS === "admin") {
        idCliente = localStorage.getItem("clientePOS") || null;
        if (!idCliente) throw new Error("Debes seleccionar un cliente.");
      } else {
        // Cliente normal autenticado: usar auth_user_id
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("No estás autenticado.");
        authUserId = user.id;
      }

      // Obtener id_tipo
      const { data: tipoPedidoData } = await supabase
        .from("Tipo_pedido")
        .select("id_tipo")
        .ilike("descripcion", `%${tipoPago}%`)
        .limit(1);
      const idTipo = tipoPedidoData?.[0]?.id_tipo || null;

      // Insertar pedido usando auth_user_id (para clientes normales) o id_cliente (para modo POS)
      const pedidoInsert = {
        fecha: new Date().toISOString(),
        id_tipo: idTipo,
        id_mesa: mesaId,
        estado: "Pendiente",
        total: parseFloat(totalCarrito.toFixed(2)),
      };
      if (modoPOS === "admin") {
        pedidoInsert.id_cliente = parseInt(idCliente);
      } else {
        pedidoInsert.auth_user_id = authUserId;
      }

      const { data: pedidoData, error: errorPedido } = await supabase
        .from("Pedido")
        .insert([pedidoInsert])
        .select();

      if (errorPedido) throw errorPedido;

      const idPedido = pedidoData[0].id_pedido;

      // Marcar mesa ocupada solo si hay mesa
      if (mesaId) {
        await supabase.from("Mesas").update({ estado: "Ocupada" }).eq("id_mesa", mesaId);
      }

      // Insertar detalles
      const detalles = carrito.map(item => ({
        id_pedido: idPedido,
        id_platillo: item.id_platillo,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(item.precio || 0),
        id_extra: item.extraSeleccionado?.id_extra || null,
        id_salsa: item.salsaSeleccionada?.id_salsa || null,
      }));

      const { error: errorDetalle } = await supabase.from("Detalle_pedido").insert(detalles);
      if (errorDetalle) throw errorDetalle;

      limpiarCarrito();
      navigate(`/mi-pedido/${idPedido}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Ocurrió un error al registrar el pedido.");
    } finally {
      setProcesando(false);
    }
  };

  // Renderizado (igual que antes, sin cambios)
  const estiloChipPill = (seleccionado, color) => ({
    padding: "5px 12px", borderRadius: 20, fontSize: "0.78rem",
    cursor: "pointer", fontWeight: 600, transition: "all 0.15s",
    border: `2px solid ${seleccionado ? color : "#e5e7eb"}`,
    background: seleccionado ? `${color}14` : "white",
    color: seleccionado ? color : "#6b7280",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "32px 20px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h2 style={{ fontWeight: 800, color: "#0c0c2c" }}><i className="bi bi-cart3 me-2" style={{ color: "#ff6a00" }} /> Tu Carrito</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {carrito.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16 }}>
            <i className="bi bi-cart-x" style={{ fontSize: "3.5rem", color: "#d1d5db" }} />
            <p>Carrito vacío</p>
            <button onClick={() => navigate("/menu")} style={{ background: "#ff6a00", color: "white", border: "none", borderRadius: 10, padding: "10px 24px" }}>Ver Menú</button>
          </div>
        ) : (
          <>
            {/* Lista de items (igual) */}
            <div style={{ background: "white", borderRadius: 16, marginBottom: 20 }}>
              {carrito.map((item, i) => {
                const categoriaLower = (item.categoriaNombre || "").toLowerCase();
                const aceptaExtras = !SIN_COMPLEMENTOS.includes(categoriaLower);
                const aceptaSalsas = CON_SALSAS.includes(categoriaLower);
                const expandido = itemExpandido === i;
                return (
                  <div key={i} style={{ borderBottom: i < carrito.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
                      <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", background: "#f3f4f6" }}>
                        {item.url_imagen ? <img src={item.url_imagen} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <i className="bi bi-image" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{item.nombre_platillo}</div>
                        {item.extraSeleccionado && <div style={{ fontSize: "0.75rem", color: "#ff6a00" }}>+ {item.extraSeleccionado.descripcion}</div>}
                        {item.salsaSeleccionada && <div style={{ fontSize: "0.75rem", color: "#ef4444" }}>+ {item.salsaSeleccionada.descripcion}</div>}
                        {(aceptaExtras || aceptaSalsas) && (
                          <button onClick={() => setItemExpandido(expandido ? null : i)} style={{ background: "none", border: "none", padding: 0, fontSize: "0.75rem", color: "#6b7280", textDecoration: "underline" }}>
                            {expandido ? "Ocultar" : "Cambiar extras / salsas"}
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => disminuirCantidad(i)} style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #e5e7eb", background: "white" }}>−</button>
                        <span style={{ fontWeight: 700 }}>{item.cantidad}</span>
                        <button onClick={() => aumentarCantidad(i)} style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #ff6a00", background: "#ff6a00", color: "white" }}>+</button>
                      </div>
                      <div style={{ minWidth: 80, textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "#ff6a00" }}>C${calcularSubtotalItem(item).toFixed(2)}</div>
                      </div>
                      <button onClick={() => eliminarDelCarrito(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><i className="bi bi-trash" /></button>
                    </div>
                    {expandido && (
                      <div style={{ padding: "0 20px 16px", background: "#fafafa" }}>
                        {aceptaExtras && todosExtras.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontWeight: 700, fontSize: "0.82rem" }}>Extras</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              <div onClick={() => actualizarExtra(i, null)} style={estiloChipPill(!item.extraSeleccionado, "#ff6a00")}>Ninguno</div>
                              {todosExtras.map(extra => (
                                <div key={extra.id_extra} onClick={() => actualizarExtra(i, item.extraSeleccionado?.id_extra === extra.id_extra ? null : extra)} style={estiloChipPill(item.extraSeleccionado?.id_extra === extra.id_extra, "#ff6a00")}>
                                  {extra.descripcion} (+C${extra.precio})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {aceptaSalsas && todasSalsas.length > 0 && (
                          <div>
                            <p style={{ fontWeight: 700, fontSize: "0.82rem" }}>Salsas</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              <div onClick={() => actualizarSalsa(i, null)} style={estiloChipPill(!item.salsaSeleccionada, "#ef4444")}>Ninguna</div>
                              {todasSalsas.map(salsa => (
                                <div key={salsa.id_salsa} onClick={() => actualizarSalsa(i, item.salsaSeleccionada?.id_salsa === salsa.id_salsa ? null : salsa)} style={estiloChipPill(item.salsaSeleccionada?.id_salsa === salsa.id_salsa, "#ef4444")}>
                                  {salsa.descripcion} (+C${salsa.precio})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tipo pago y resumen */}
            <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
              <h5>Tipo de pago</h5>
              <div style={{ display: "flex", gap: 12 }}>
                {["Efectivo", "Tarjeta"].map(tipo => (
                  <div key={tipo} onClick={() => setTipoPago(tipo)} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: `2px solid ${tipoPago === tipo ? "#ff6a00" : "#e5e7eb"}`, textAlign: "center" }}>
                    <i className={`bi ${tipo === "Efectivo" ? "bi-cash" : "bi-credit-card"}`} style={{ fontSize: "1.5rem", display: "block", marginBottom: 6, color: tipoPago === tipo ? "#ff6a00" : "#9ca3af" }} />
                    <span>{tipo}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
              <h5>Resumen</h5>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span>Subtotal</span><span>C${totalCarrito.toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total</span><span style={{ fontWeight: 800, fontSize: "1.2rem", color: "#ff6a00" }}>C${totalCarrito.toFixed(2)}</span></div>
            </div>

            <button onClick={procederPago} disabled={procesando} style={{ width: "100%", padding: "15px", background: procesando ? "#9ca3af" : "#ff6a00", color: "white", border: "none", borderRadius: 14, fontWeight: 800 }}>
              {procesando ? "Procesando..." : `Proceder al Pago — C${totalCarrito.toFixed(2)}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Carrito;