import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import TarjetaMenu from "../components/menu/TarjetaMenu";
import BotonCarrito from "../components/carrito/BotonCarrito";
import { useCarrito } from "../components/contexto/CarritoContexto";

const Menu = () => {
  const { idMesa } = useParams();

  const [platillos, setPlatillos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [extras, setExtras] = useState([]);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const { agregarAlCarrito } = useCarrito();
  const navegar = useNavigate();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);

        const [resPlatillos, resCategorias, resExtras] = await Promise.all([
          supabase
            .from("Platillos")
            .select("*")
            .order("nombre_platillo", { ascending: true }),

          supabase
            .from("Categorias")
            .select("*")
            .order("nombre_categoria", { ascending: true }),

          supabase
            .from("Extras")
            .select("*")
            .order("descripcion", { ascending: true }),
        ]);

        setPlatillos(resPlatillos.data || []);
        setCategorias(resCategorias.data || []);
        setExtras(resExtras.data || []);
      } catch (err) {
        console.error("Error al cargar menú:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const obtenerNombreCategoria = (idCategoria) => {
    const categoria = categorias.find(
      (c) => c.id_categoria === idCategoria
    );

    return categoria?.nombre_categoria || "Sin categoría";
  };

  const platillosFiltrados = useMemo(() => {
    let filtrados = platillos;

    if (categoriaSeleccionada !== "todas") {
      filtrados = filtrados.filter(
        (p) => p.categoria_platillo === parseInt(categoriaSeleccionada)
      );
    }

    if (textoBusqueda.trim()) {
      const texto = textoBusqueda.toLowerCase().trim();

      filtrados = filtrados.filter(
        (p) =>
          p.nombre_platillo?.toLowerCase().includes(texto) ||
          p.descripcion?.toLowerCase().includes(texto)
      );
    }

    return filtrados;
  }, [platillos, categoriaSeleccionada, textoBusqueda]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
        paddingBottom: "110px",
        overflowX: "hidden",
      }}
    >
      <BotonCarrito visible={true} />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "105px 16px 30px",
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navegar(-1)}
            className="btn btn-dark mb-3"
            style={{
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            <i className="bi bi-arrow-left"></i>
          </button>

          <h2
            style={{
              fontWeight: 900,
              color: "#0c0c2c",
              marginBottom: 6,
              fontSize: "clamp(1.5rem, 5vw, 2rem)",
            }}
          >
            Mesa #{idMesa || ""}
          </h2>

          <p
            style={{
              color: "#6b7280",
              marginBottom: 0,
              fontSize: "0.95rem",
            }}
          >
            Realiza tu pedido desde esta mesa
          </p>
        </div>

        {/* BUSCADOR */}
        <div
          style={{
            marginBottom: 22,
            width: "100%",
            maxWidth: 520,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "white",
              borderRadius: 16,
              padding: "14px 16px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            <i
              className="bi bi-search"
              style={{
                fontSize: "1.25rem",
                color: "#111827",
              }}
            ></i>

            <input
              type="text"
              placeholder="Buscar platillos..."
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                background: "transparent",
                fontSize: "1rem",
                minWidth: 0,
              }}
            />
          </div>
        </div>

        {/* FILTROS */}
        {!cargando && (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: 10,
              marginBottom: 26,
              overflowX: "auto",
              paddingBottom: 8,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <button
              onClick={() => setCategoriaSeleccionada("todas")}
              style={{
                flex: "0 0 auto",
                padding: "10px 18px",
                borderRadius: 999,
                border: "none",
                background:
                  categoriaSeleccionada === "todas" ? "#ff6a00" : "white",
                color:
                  categoriaSeleccionada === "todas" ? "white" : "#374151",
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              Todo
            </button>

            {categorias.map((cat) => (
              <button
                key={cat.id_categoria}
                onClick={() =>
                  setCategoriaSeleccionada(String(cat.id_categoria))
                }
                style={{
                  flex: "0 0 auto",
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    categoriaSeleccionada === String(cat.id_categoria)
                      ? "#ff6a00"
                      : "white",
                  color:
                    categoriaSeleccionada === String(cat.id_categoria)
                      ? "white"
                      : "#374151",
                  fontWeight: 800,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                {cat.nombre_categoria}
              </button>
            ))}
          </div>
        )}

        {/* SPINNER */}
        {cargando && (
          <div className="text-center my-5">
            <Spinner animation="border" />
            <p className="mt-3 text-muted">Cargando menú...</p>
          </div>
        )}

        {/* VACÍO */}
        {!cargando && platillosFiltrados.length === 0 && (
          <Alert variant="info">No hay platillos disponibles</Alert>
        )}

        {/* PLATILLOS */}
        {!cargando && platillosFiltrados.length > 0 && (
          <Row className="g-3">
            {platillosFiltrados.map((platillo) => (
              <Col
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={platillo.id_platillo}
              >
                <TarjetaMenu
                  platillo={platillo}
                  categoriaNombre={obtenerNombreCategoria(
                    platillo.categoria_platillo
                  )}
                  extras={extras}
                  onAgregar={(item) => {
                    agregarAlCarrito({
                      ...item,
                      id_mesa: parseInt(idMesa),
                    });
                  }}
                  esInvitado={false}
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