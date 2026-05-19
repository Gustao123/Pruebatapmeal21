// components/mesas/TarjetaMesaPOS.jsx
import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../database/supabaseconfig";

const TarjetaMesaPOS = ({ mesa }) => {
  const navigate = useNavigate();
  const [tienePedidoActivo, setTienePedidoActivo] = useState(false);
  const [cargando, setCargando] = useState(true);

  const verificarPedidoActivo = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("Pedido")
        .select("id_pedido")
        .eq("id_mesa", mesa.id_mesa)
        .in("estado", ["Pendiente", "En preparación"]);
      if (error) throw error;
      setTienePedidoActivo(data && data.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    verificarPedidoActivo();
    const subscription = supabase
      .channel(`pedidos-mesa-${mesa.id_mesa}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Pedido", filter: `id_mesa=eq.${mesa.id_mesa}` },
        () => verificarPedidoActivo()
      )
      .subscribe();
    return () => subscription.unsubscribe();
  }, [mesa.id_mesa]);

  const abrirMesa = () => {
    localStorage.setItem("idMesa", mesa.id_mesa);
    localStorage.setItem("nombreMesa", mesa.nombre_mesa);
    localStorage.setItem("modoPOS", "admin");
    navigate(`/menu/${mesa.id_mesa}`);  // ✅ URL limpia con ID numérico
  };

  const verEstadoPedido = () => {
    navigate(`/estado-mesa/${mesa.id_mesa}`);
  };

  const estadoActual = tienePedidoActivo ? "Ocupada" : "Disponible";
  const badgeColor = tienePedidoActivo ? "danger" : "success";
  const iconoColor = tienePedidoActivo ? "bi-x-circle-fill text-danger" : "bi-qr-code-scan text-success";

  return (
    <Card className="shadow-sm border-0 h-100 text-center" style={{ borderRadius: "20px" }}>
      <Card.Body className="p-4">
        <div className="mb-3">
          <i className={`bi ${iconoColor}`} style={{ fontSize: "5rem" }} />
        </div>
        <h2 className="fw-bold">{mesa.nombre_mesa}</h2>
        <p className="text-muted mb-3">Mesa #{mesa.id_mesa}</p>
        <Badge bg={badgeColor} className="px-3 py-2 mb-4">{estadoActual}</Badge>
        {tienePedidoActivo && (
          <Badge bg="warning" text="dark" className="mb-3 d-block">
            <i className="bi bi-bell-fill me-1"></i> Pedido en espera
          </Badge>
        )}
        <div className="d-grid gap-2">
          <Button variant="dark" onClick={abrirMesa}>
            <i className="bi bi-box-arrow-up-right me-2"></i>Abrir Mesa
          </Button>
          <Button variant="outline-dark" onClick={verEstadoPedido}>
            <i className="bi bi-receipt me-2"></i>Ver estado del pedido
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TarjetaMesaPOS;