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
  const [nombreCliente, setNombreCliente] = useState("");
  const { agregarAlCarrito } = useCarrito();
  const navigate = useNavigate();
  const { idMesa } = useParams();
  const [nombreMesa, setNombreMesa] = useState("");

  // Guardar mesa y cargar nombre
  useEffect(() => {
    if (idMesa) {
      localStorage.setItem("idMesa", idMesa);
      const cargarNombreMesa = async () => {
        try {
          const { data, error } = await supabase
            .from("Mesas")
            .select("nombre_mesa")
            .eq("id_mesa", idMesa)
            .single();
          if (error) throw error;
          setNombreMesa(data?.nombre_mesa || `Mesa ${idMesa}`);
        } catch {
          setNombreMesa(`Mesa ${idMesa}`);
        }
      };
      cargarNombreMesa();
    } else {
      localStorage.removeItem("idMesa");
      setNombreMesa("");
    }
  }, [idMesa]);

  // Verificar sesión y obtener nombre del cliente desde user_metadata
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
          setNombreCliente("");
        } 
        else if (user && rol === "cliente") {
          setSesionActiva(true);
          setEsAdmin(false);
          // Obtener nombre desde user_metadata
          const metadata = user.user_metadata;
          const nombre = metadata?.nombre || "";
          const apellido = metadata?.apellido || "";
          if (nombre || apellido) {
            setNombreCliente(`${nombre} ${apellido}`.trim());
          } else {
            setNombreCliente(user.email);
          }
        } 
        else {
          setSesionActiva(false);
          setEsAdmin(false);
          setNombreCliente("");
        }
      } catch (err) {
        console.error(err);
        setSesionActiva(false);
      }
    };
    verificarSesion();
  }, []);

  // Cargar menú (sin cambios)
  useEffect(() => {
    const cargarMenu = async () => {
      setCargando(true);
      try {
        const [resPlatillos, resCategorias, resExtras] = await Promise.all([
          supabase.from("Platillos").select("*").order("nombre_platillo"),
          supabase.from("Categorias").select("id_categoria, nombre_categoria").order("nombre_categoria"),
          supabase.from("Extras").select("*").order("descripcion"),
        ]);
        setPlatillos(resPlatillos.data || []);
        setCategorias(resCategorias.data || []);
        setExtras(resExtras.data || []);
      } catch (err) {
        setErrorCarga("Error al cargar menú");
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
        p.descripcion?.toLowerCase().includes(lower)
      );
    }
    return filtrados;
  }, [platillos, categoriaSeleccionada, textoBusqueda]);

  const obtenerNombreCategoria = (idCategoria) => {
    const cat = categorias.find(c => c.id_categoria === idCategoria);
    return cat ? cat.nombre_categoria : "Sin categoría";
  };

  if (errorCarga) return <div className="text-center mt-5">Error: {errorCarga}</div>;
  if (cargando) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {!sesionActiva && (
        <div style={{ background: "rgba(255,106,0,0.06)", padding: "10px 24px", textAlign: "center", fontSize: "0.85rem", color: "#92400e" }}>
          <i className="bi bi-eye me-2" /> Estás como <strong>invitado</strong>.{" "}
          <span onClick={() => navigate(idMesa ? `/registro?mesa=${idMesa}` : "/registro")} style={{ color: "#ff6a00", cursor: "pointer", textDecoration: "underline" }}>Regístrate</span> para ordenar.
        </div>
      )}

      <BotonCarrito visible={sesionActiva} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, color: "#0c0c2c" }}>Menú</h2>
          {nombreMesa && <Badge bg="dark" className="mt-2"><i className="bi bi-table me-1"></i> {nombreMesa}</Badge>}
          {!idMesa && <div className="text-muted small mt-2"><i className="bi bi-info-circle"></i> Pedido en línea</div>}
          {sesionActiva && !esAdmin && nombreCliente && (
            <div style={{ marginTop: 12, fontSize: "0.9rem", background: "rgba(255,106,0,0.08)", padding: "8px 12px", borderRadius: 10, display: "inline-block" }}>
              <i className="bi bi-person-circle me-1" style={{ color: "#ff6a00" }}></i> Pedido a nombre de: <strong>{nombreCliente}</strong>
            </div>
          )}
        </div>

        {esAdmin && clientes.length > 0 && (
          <div style={{ marginBottom: 20, background: "white", borderRadius: 12, padding: "14px 18px" }}>
            <label style={{ fontWeight: 600, marginRight: 10 }}>Cliente:</label>
            <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc" }}>
              <option value="">-- Seleccionar --</option>
              {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_cliente} {c.apellido_cliente}</option>)}
            </select>
            {!clienteSeleccionado && <span className="text-danger ms-2 small">Debes elegir un cliente</span>}
          </div>
        )}

        {/* Buscador y filtros (igual que antes) */}
        <div style={{ marginBottom: 20, maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 10, padding: "8px 14px", border: "1px solid #e5e7eb" }}>
            <i className="bi bi-search" />
            <input type="text" placeholder="Buscar..." value={textoBusqueda} onChange={e => setTextoBusqueda(e.target.value)} style={{ border: "none", outline: "none", flex: 1 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button onClick={() => setCategoriaSeleccionada("todas")} style={{ padding: "6px 16px", borderRadius: 20, border: "none", fontWeight: 600, background: categoriaSeleccionada === "todas" ? "#ff6a00" : "white", color: categoriaSeleccionada === "todas" ? "white" : "#374151" }}>Todo</button>
          {categorias.map(cat => (
            <button key={cat.id_categoria} onClick={() => setCategoriaSeleccionada(String(cat.id_categoria))} style={{ padding: "6px 16px", borderRadius: 20, border: "none", fontWeight: 600, background: categoriaSeleccionada === String(cat.id_categoria) ? "#ff6a00" : "white", color: categoriaSeleccionada === String(cat.id_categoria) ? "white" : "#374151" }}>
              {cat.nombre_categoria}
            </button>
          ))}
        </div>

        {platillosFiltrados.length === 0 && <Alert variant="info">No hay platillos</Alert>}
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
      </div>
    </div>
  );
};

export default Menu;