import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormularioLogin from "../components/login/FormularioLogin";
import { supabase } from "../database/supabaseconfig";
import Logo from "../assets/Logo.png";

const Login = () => {

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);

  const navegar = useNavigate();

  // REDIRECCIÓN SEGÚN ROL
  const redirigirSegunRol = (rol) => {

    // ADMIN
    if (rol === "admin") {

      // AHORA MANDA A MESAS / POS
      navegar("/mesas");

    }

    // CLIENTE
    else if (rol === "cliente") {

      navegar("/");

    }

    // DEFAULT
    else {

      navegar("/");

    }
  };

  // LOGIN
  const iniciarSesion = async () => {

    setError(null);

    // VALIDACIÓN
    if (!usuario.trim() || !contrasena.trim()) {

      setError("Por favor completa todos los campos.");

      return;
    }

    try {

      // LOGIN SUPABASE
      const { data, error: errorAuth } =
        await supabase.auth.signInWithPassword({
          email: usuario.trim(),
          password: contrasena,
        });

      // ERROR LOGIN
      if (errorAuth) {

        setError("Usuario o contraseña incorrectos.");

        return;
      }

      // LOGIN CORRECTO
      if (data.user) {

        const rol = data.user.user_metadata?.rol;

        localStorage.setItem(
          "usuario-supabase",
          usuario.trim()
        );

        redirigirSegunRol(rol);
      }

    } catch (err) {

      console.error(err);

      setError("Error al conectar con el servidor.");
    }
  };

  // VERIFICAR SESIÓN ACTIVA
  useEffect(() => {

    const verificarSesion = async () => {

      const { data } =
        await supabase.auth.getSession();

      // SI YA HAY SESIÓN
      if (data.session) {

        const rol =
          data.session.user?.user_metadata?.rol;

        redirigirSegunRol(rol);
      }
    };

    verificarSesion();

  }, []);

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f0f2f5",
        fontFamily: "'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >

      {/* NAVBAR */}
      <nav
        style={{
          background: "white",
          padding: "0 28px",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      >

        {/* LOGO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer"
          }}
          onClick={() => navegar("/")}
        >

          <img
            src={Logo}
            alt="Logo TapMeal"
            style={{
              height: 34,
              objectFit: "contain"
            }}
          />

          <span
            style={{
              fontWeight: 800,
              fontSize: "1.3rem",
              color: "#0c0c2c"
            }}
          >
            TapMeal
          </span>

        </div>

        {/* TEXTO LOGIN */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#0c0c2c",
            fontSize: "0.88rem",
            fontWeight: 600
          }}
        >

          <i className="bi bi-person-fill" />

          <span>
            Iniciar Sesión
          </span>

        </div>

      </nav>

      {/* CONTENIDO */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
        }}
      >

        <div>

          {/* FORM LOGIN */}
          <FormularioLogin
            usuario={usuario}
            contrasena={contrasena}
            error={error}
            setUsuario={setUsuario}
            setContrasena={setContrasena}
            iniciarSesion={iniciarSesion}
          />

          {/* REGISTRO */}
          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: "0.88rem",
              color: "#6b7280"
            }}
          >

            ¿No tienes cuenta?{" "}

            <span
              onClick={() => navegar("/registro")}
              style={{
                color: "#ff6a00",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Regístrate aquí
            </span>

          </p>

        </div>

      </div>

    </div>
  );
};

export default Login;