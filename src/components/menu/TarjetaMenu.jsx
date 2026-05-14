import React, { useState, useEffect } from "react";
import { Card, Badge, Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../database/supabaseconfig";

const SIN_COMPLEMENTOS = ["frappés", "bebidas", "postres", "licores"];
const CON_SALSAS = ["comidas", "alitas"];

const TarjetaMenu = ({
  platillo,
  categoriaNombre,
  extras,
  onAgregar,
  esInvitado,
}) => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [extraSeleccionado, setExtraSeleccionado] = useState(null);
  const [salsaSeleccionada, setSalsaSeleccionada] = useState(null);
  const [salsas, setSalsas] = useState([]);

  const navegar = useNavigate();

  const categoriaLower = (categoriaNombre || "").toLowerCase();
  const aceptaComplementos =
    !SIN_COMPLEMENTOS.includes(categoriaLower);
  const aceptaSalsas =
    CON_SALSAS.includes(categoriaLower);

  useEffect(() => {
    if (
      mostrarModal &&
      aceptaSalsas &&
      salsas.length === 0
    ) {
      const cargarSalsas = async () => {
        const { data } = await supabase
          .from("Salsas")
          .select("*")
          .order("descripcion");

        if (data) setSalsas(data);
      };

      cargarSalsas();
    }
  }, [mostrarModal]);

  const descripcion = platillo.descripcion || "";

  const preview =
    descripcion.length > 60
      ? descripcion.substring(0, 60) + "..."
      : descripcion;

  const cerrarModal = () => {
    setMostrarModal(false);
    setExtraSeleccionado(null);
    setSalsaSeleccionada(null);
  };

  const handleAgregar = () => {
    if (esInvitado) {
      navegar("/registro");
      return;
    }

    onAgregar({
      ...platillo,
      extraSeleccionado,
      salsaSeleccionada,
      categoriaNombre,
    });

    cerrarModal();
  };

  const precioTotal = () => {
    let total = parseFloat(platillo.precio || 0);

    if (extraSeleccionado) {
      total += parseFloat(
        extraSeleccionado.precio || 0
      );
    }

    if (salsaSeleccionada) {
      total += parseFloat(
        salsaSeleccionada.precio || 0
      );
    }

    return total;
  };

  const estiloChip = (
    seleccionado,
    color = "#ff6a00"
  ) => ({
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: "0.82rem",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.15s",
    border: `2px solid ${
      seleccionado ? color : "#e5e7eb"
    }`,
    background: seleccionado
      ? `${color}14`
      : "white",
    color: seleccionado
      ? color
      : "#374151",
  });

  return (
    <>
      <Card
        className="h-100 border-0 shadow-sm overflow-hidden"
        style={{
          borderRadius: 18,
          cursor: "pointer",
          transition:
            "transform 0.2s, box-shadow 0.2s",
          width: "100%",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform =
            "translateY(-4px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform =
            "translateY(0)")
        }
        onClick={() => setMostrarModal(true)}
      >
        {/* Imagen */}
        <div
          style={{
            height: 160,
            overflow: "hidden",
            background: "#f3f4f6",
          }}
        >
          {platillo.url_imagen ? (
            <img
              src={platillo.url_imagen}
              alt={platillo.nombre_platillo}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.4s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform =
                  "scale(1.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform =
                  "scale(1)")
              }
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <i
                className="bi bi-image text-muted"
                style={{ fontSize: "2.5rem" }}
              />
            </div>
          )}
        </div>

        {/* Body */}
        <Card.Body className="p-3 d-flex flex-column">
          <Badge
            bg="warning"
            text="dark"
            pill
            className="mb-2 align-self-start"
            style={{
              fontSize: "0.7rem",
            }}
          >
            {categoriaNombre}
          </Badge>

          <h6
            className="fw-bold mb-1"
            style={{
              color: "#0c0c2c",
              fontSize: "0.92rem",
              lineHeight: 1.25,
            }}
          >
            {platillo.nombre_platillo}
          </h6>

          {descripcion && (
            <p
              className="text-muted mb-2"
              style={{
                fontSize: "0.78rem",
                lineHeight: 1.5,
                flexGrow: 1,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {preview}
            </p>
          )}

          {/* PRECIO + BOTÓN CORREGIDO */}
          <div
            className="mt-auto pt-2"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
            }}
          >
            <span
              className="fw-bold"
              style={{
                color: "#ff6a00",
                fontSize: "1rem",
                whiteSpace: "nowrap",
              }}
            >
              C$
              {parseFloat(
                platillo.precio || 0
              ).toFixed(2)}
            </span>

            <button
              style={{
                background: "#ff6a00",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setMostrarModal(true);
              }}
            >
              <i className="bi bi-cart-plus" />
              Agregar
            </button>
          </div>
        </Card.Body>
      </Card>

      {/* MODAL */}
      <Modal
        show={mostrarModal}
        onHide={cerrarModal}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          className="border-0 pb-0"
        >
          <Modal.Title
            className="fw-bold"
            style={{ color: "#0c0c2c" }}
          >
            {platillo.nombre_platillo}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-2">
          <div className="row g-4">
            <div className="col-md-5">
              {platillo.url_imagen ? (
                <img
                  src={platillo.url_imagen}
                  alt={
                    platillo.nombre_platillo
                  }
                  className="img-fluid rounded"
                  style={{
                    maxHeight: 280,
                    objectFit: "cover",
                    width: "100%",
                  }}
                />
              ) : (
                <div
                  className="bg-light rounded d-flex align-items-center justify-content-center"
                  style={{ height: 280 }}
                >
                  <i
                    className="bi bi-image text-muted"
                    style={{
                      fontSize: "3rem",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="col-md-7 d-flex flex-column">
              <Badge
                bg="warning"
                text="dark"
                pill
                className="mb-2 align-self-start"
              >
                {categoriaNombre}
              </Badge>

              <h4
                className="fw-bold mb-2"
                style={{
                  color: "#ff6a00",
                }}
              >
                C$
                {parseFloat(
                  platillo.precio || 0
                ).toFixed(2)}
              </h4>

              {descripcion && (
                <p className="text-muted">
                  {descripcion}
                </p>
              )}

              {(extraSeleccionado ||
                salsaSeleccionada) && (
                <div
                  className="mt-3 p-2 rounded"
                  style={{
                    background:
                      "rgba(255,106,0,0.06)",
                    border:
                      "1px solid rgba(255,106,0,0.2)",
                  }}
                >
                  <small className="text-muted">
                    Total con selección:
                  </small>

                  <div
                    className="fw-bold"
                    style={{
                      color: "#ff6a00",
                      fontSize: "1.1rem",
                    }}
                  >
                    C$
                    {precioTotal().toFixed(
                      2
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={cerrarModal}
          >
            Cerrar
          </Button>

          {!esInvitado && (
            <button
              onClick={handleAgregar}
              style={{
                background: "#ff6a00",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Agregar al carrito — C$
              {precioTotal().toFixed(2)}
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TarjetaMenu;