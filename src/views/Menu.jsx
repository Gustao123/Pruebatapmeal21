// views/Menu.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../database/supabaseconfig";
import TarjetaMenu from "../components/menu/TarjetaMenu";
import BotonCarrito from "../components/carrito/BotonCarrito";
import { useCarrito } from "../components/contexto/CarritoContexto";

const Menu = () => {
  const [platillos, setPlatillos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [extras, setExtras] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [sesionActiva, setSesionActiva] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const { agregarAlCarrito } = useCarrito();
  const navigate = useNavigate();
  const { idMesa } = useParams();  // puede venir de la ruta /menu/:idMesa
  const [nombreMesa, setNombreMesa] = useState("");

  // Guardar mesa en localStorage si existe
  useEffect(() => {
    if (idMesa) {
      localStorage.setItem("idMesa", idMesa);
      // También cargar nombre de la mesa para mostrarlo
      const cargarNombreMesa = async () => {
        const { data } = await supabase
          .from("Mesas")
          .select("nombre_mesa")
          .eq("id_mesa", idMesa)
          .single();
        if (data) setNombreMesa(data.nombre_mesa);
      };
      cargarNombreMesa();
    } else {
      localStorage.removeItem("idMesa");
      setNombreMesa("");
    }
  }, [idMesa]);

  // Verificar sesión (igual que antes)
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const rol = user?.user_metadata?.rol;
        const modoPOS = localStorage.getItem("modoPOS");

        if (user && rol === "admin" && modoPOS === "admin") {
          setSesionActiva(true);
          setEsAdmin(true);
          const { data: clientesData } = await supabase
            .from("Clientes")
            .select("id_cliente, nombre_cliente, apellido_cliente");
          if (clientesData) setClientes(clientesData);
        } else if (user && rol === "cliente") {
          setSesionActiva(true);
          setEsAdmin(false);
        } else {
          setSesionActiva(false);
          setEsAdmin(false);
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
        setSesionActiva(false);
      }
    };
    verificarSesion();
  }, []);

  // Guardar cliente seleccionado para POS
  useEffect(() => {
    if (esAdmin) {
      localStorage.setItem("clientePOS", clienteSeleccionado);
    }
  }, [clienteSeleccionado, esAdmin]);

  // Cargar menú
  useEffect(() => {
    const cargarMenu = async () => {
      setCargando(true);
      setErrorCarga(null);
      try {
        const [resPlatillos, resCategorias, resExtras] = await Promise.all([
          supabase.from("Platillos").select("*").order("nombre_platillo"),
          supabase.from("Categorias").select("id_categoria, nombre_categoria").order("nombre_categoria"),
          supabase.from("Extras").select("*").order("descripcion"),
        ]);
        if (resPlatillos.error) throw resPlatillos.error;
        if (resCategorias.error) throw resCategorias.error;
        if (resExtras.error) throw resExtras.error;
        setPlatillos(resPlatillos.data || []);
        setCategorias(resCategorias.data || []);
        setExtras(resExtras.data || []);
      } catch (err) {
        console.error("Error cargando menú:", err);
        setErrorCarga("No se pudo cargar el menú. Intenta recargar la página.");
      } finally {
        setCargando(false);
      }
    };
    cargarMenu();
  }, []);

  const platillosFiltrados = useMemo(() => {
    let filtrados = platillos;
    if (categoriaSeleccionada !== "todas") {
      filtrados = filtrados.filter(p => p.categoria_platillo === parseInt(categoriaSeleccionada));
    }
    if (textoBusqueda.trim()) {
      const lower = textoBusqueda.toLowerCase();
      filtrados = filtrados.filter(p =>
        p.nombre_platillo?.toLowerCase().includes(lower) ||
        p.descripción?.toLowerCase().includes(lower)
      );
    }
    return filtrados;
  }, [platillos, categoriaSeleccionada, textoBusqueda]);

  const obtenerNombreCategoria = (idCategoria) => {
    const cat = categorias.find(c => c.id_categoria === idCategoria);
    return cat ? cat.nombre_categoria : "Sin categoría";
  };

  if (errorCarga) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 20 }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 48, color: "#dc3545" }}></i>
          <h4 className="mt-3">Error al cargar el menú</h4>
          <p className="text-muted">{errorCarga}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ background: "#ff6a00", border: "none" }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner animation="border" style={{ color: "#ff6a00" }} />
        <p className="ms-2">Cargando menú...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'Segoe UI', sans-serif" }}>
      {!sesionActiva && (
        <div style={{ background: "rgba(255,106,0,0.06)", borderBottom: "1px solid rgba(255,106,0,0.15)", padding: "10px 24px", textAlign: "center", fontSize: "0.85rem", color: "#92400e" }}>
          <i className="bi bi-eye me-2" /> Estás viendo el menú como <strong>invitado</strong>.{" "}
          <span onClick={() => navigate(idMesa ? `/registro?mesa=${idMesa}` : "/registro")} style={{ color: "#ff6a00", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Regístrate gratis</span> para ordenar.
        </div>
      )}

      <BotonCarrito visible={sesionActiva} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, color: "#0c0c2c", marginBottom: 4 }}>Menú</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: 0 }}>
            {sesionActiva ? "Elige tus platillos favoritos" : "Explora nuestros platillos"}
          </p>
          {nombreMesa && (
            <Badge bg="dark" className="mt-2" style={{ fontSize: "0.9rem" }}>
              <i className="bi bi-table me-1"></i> {nombreMesa}
            </Badge>
          )}
          {!idMesa && (
            <div style={{ marginTop: 8, fontSize: "0.75rem", color: "#6c757d" }}>
              <i className="bi bi-info-circle"></i> Viendo menú sin mesa asignada. (Pedido en línea)
            </div>
          )}
        </div>

        {esAdmin && clientes.length > 0 && (
          <div style={{ marginBottom: 20, background: "white", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <label style={{ fontWeight: 600, marginRight: 10, color: "#0c0c2c" }}>
              <i className="bi bi-person-badge me-1" style={{ color: "#ff6a00" }} /> Cliente:
            </label>
            <select
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc", minWidth: 200 }}
            >
              <option value="">-- Seleccionar --</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre_cliente} {c.apellido_cliente}
                </option>
              ))}
            </select>
            {clienteSeleccionado === "" && (
              <span style={{ marginLeft: 12, color: "#dc3545", fontSize: "0.8rem" }}>
                Debes elegir un cliente para continuar
              </span>
            )}
          </div>
        )}

        <div style={{ marginBottom: 20, maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 10, padding: "8px 14px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}>
            <i className="bi bi-search" style={{ color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Buscar platillos..."
              value={textoBusqueda}
              onChange={e => setTextoBusqueda(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, fontSize: "0.9rem", background: "transparent" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button
            onClick={() => setCategoriaSeleccionada("todas")}
            style={{
              padding: "6px 16px", borderRadius: 20, border: "none", fontWeight: 600,
              fontSize: "0.82rem", cursor: "pointer",
              background: categoriaSeleccionada === "todas" ? "#ff6a00" : "white",
              color: categoriaSeleccionada === "todas" ? "white" : "#374151",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
            }}
          >
            Todo
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id_categoria}
              onClick={() => setCategoriaSeleccionada(String(cat.id_categoria))}
              style={{
                padding: "6px 16px", borderRadius: 20, border: "none", fontWeight: 600,
                fontSize: "0.82rem", cursor: "pointer",
                background: categoriaSeleccionada === String(cat.id_categoria) ? "#ff6a00" : "white",
                color: categoriaSeleccionada === String(cat.id_categoria) ? "white" : "#374151",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
              }}
            >
              {cat.nombre_categoria}
            </button>
          ))}
        </div>

        {platillosFiltrados.length === 0 && (
          <Alert variant="info" className="text-center">
            <i className="bi bi-info-circle me-2" /> No se encontraron platillos.
          </Alert>
        )}

        {platillosFiltrados.length > 0 && (
          <Row className="g-3">
            {platillosFiltrados.map(platillo => (
              <Col xs={6} sm={6} md={4} lg={3} key={platillo.id_platillo}>
                <TarjetaMenu
                  platillo={platillo}
                  categoriaNombre={obtenerNombreCategoria(platillo.categoria_platillo)}
                  extras={extras}
                  onAgregar={agregarAlCarrito}
                  esInvitado={!sesionActiva}
                  mesaId={idMesa || null}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default Menu;