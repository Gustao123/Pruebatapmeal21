import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const TarjetaMesaPOS = ({ mesa }) => {
  const navigate = useNavigate();

  const abrirMesa = () => {
    localStorage.setItem("idMesa", mesa.id_mesa);
    navigate(`/menu/${mesa.id_mesa}`);
  };

  const verPedidos = () => {
    navigate("/pedidos");
  };

  return (
    <Card className="shadow-sm border-0 rounded-4 h-100 tarjeta-pos">
      <Card.Body className="d-flex flex-column justify-content-between">
        <div className="text-center">
          <div className="mb-3">
            <i
              className="bi bi-qr-code-scan"
              style={{
                fontSize: "4rem",
                color: "#198754",
              }}
            />
          </div>

          <h3 className="fw-bold">Mesa {mesa.id_mesa}</h3>

          <p className="text-muted mb-2">
            {mesa.nombre_mesa}
          </p>

          <Badge bg="success" className="px-3 py-2">
            Disponible
          </Badge>
        </div>

        <div className="mt-4 d-grid gap-2">
          <Button variant="dark" onClick={abrirMesa}>
            <i className="bi bi-box-arrow-up-right me-2" />
            Abrir Mesa
          </Button>

          <Button variant="outline-dark" onClick={verPedidos}>
            <i className="bi bi-receipt me-2" />
            Ver Pedidos
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TarjetaMesaPOS;