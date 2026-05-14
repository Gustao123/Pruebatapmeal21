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
            .order("nombre_categoria"),

          supabase
            .from("Extras")
            .select("*")
            .order("descripcion")
        ]);

        setPlatillos(resPlatillos.data || []);
        setCategorias(resCategorias.data || []);
        setExtras(resExtras.data || []);

      } catch (err) {

        console.error(err);

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
        (p) =>
          p.categoria_platillo === parseInt(categoriaSeleccionada)
      );
    }

    if (textoBusqueda.trim()) {

      const texto = textoBusqueda.toLowerCase();

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
        paddingBottom: "100px",
      }}
    >

      <BotonCarrito visible={true} />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "25px 20px",
        }}
      >

        {/* HEADER */}
        <div className="mb-4">

          <button
            onClick={() => navegar(-1)}
            className="btn btn-dark mb-3"
          >
            <i className="bi bi-arrow-left"></i>
          </button>

          <h2
            style={{
              fontWeight: 800,
              color: "#0c0c2c",
            }}
          >
            Mesa #{idMesa}
          </h2>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            Realiza tu pedido desde esta mesa
          </p>
        </div>

        {/* BUSCADOR */}
        <div
          style={{
            marginBottom: 20,
            maxWidth: 400,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "white",
              borderRadius: 10,
              padding: "8px 14px",
              border: "1px solid #e5e7eb",
            }}
          >

            <i className="bi bi-search"></i>

            <input
              type="text"
              placeholder="Buscar platillos..."
              value={textoBusqueda}
              onChange={(e) =>
                setTextoBusqueda(e.target.value)
              }
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                background: "transparent",
              }}
            />
          </div>
        </div>

        {/* FILTROS */}
        {!cargando && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
            }}
          >

            <button
              onClick={() =>
                setCategoriaSeleccionada("todas")
              }
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                border: "none",
                background:
                  categoriaSeleccionada === "todas"
                    ? "#ff6a00"
                    : "white",
                color:
                  categoriaSeleccionada === "todas"
                    ? "white"
                    : "#374151",
                fontWeight: 600,
              }}
            >
              Todo
            </button>

            {categorias.map((cat) => (
              <button
                key={cat.id_categoria}
                onClick={() =>
                  setCategoriaSeleccionada(
                    String(cat.id_categoria)
                  )
                }
                style={{
                  padding: "7px 16px",
                  borderRadius: 20,
                  border: "none",
                  background:
                    categoriaSeleccionada ===
                    String(cat.id_categoria)
                      ? "#ff6a00"
                      : "white",
                  color:
                    categoriaSeleccionada ===
                    String(cat.id_categoria)
                      ? "white"
                      : "#374151",
                  fontWeight: 600,
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
          </div>
        )}

        {/* VACÍO */}
        {!cargando &&
          platillosFiltrados.length === 0 && (
            <Alert variant="info">
              No hay platillos disponibles
            </Alert>
          )}

        {/* PLATILLOS */}
        {!cargando &&
          platillosFiltrados.length > 0 && (
            <Row className="g-3">

              {platillosFiltrados.map((platillo) => (

                <Col
                  xs={6}
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