# 🛒 CastillaWeb - Sistema POS e Inventario (SaaS Frontend)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/zustand-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Framer Motion](https://img.shields.io/badge/Framer--Motion-black?style=for-the-badge&logo=framer&logoColor=blue)

CastillaWeb es el **Frontend** de una plataforma de inventario y punto de venta integral tipo SaaS (Software as a Service). Está diseñado para proporcionar la mejor experiencia de usuario (UX) mediante animaciones fluidas, un modo oscuro moderno y robustas capacidades para manejar comercios corporativos (desde tiendas pequeñas hasta supermercados que registran ventas fraccionales a granel).

## ✨ Características Principales

*   **🛡️ Sistema SaaS Seguro:** Cuentas gestionadas internamente mediante un panel administrativo (`AdminUserCreator`). Incluye flujos robustos de autenticación (Login, Verificación de Email, Recuperación de Contraseña).
*   **⏳ Gestión de Suscripciones:** Integración de un interceptor de red global (`Axios`) que captura cortes de caducidad. Si un plan o trial concluye, la aplicación redirige a la página **`SubscriptionExpiredPage`**.
*   **⚖️ Ventas y Stock a Granel (Inventario Multiescala):** Soporte total para manejo y fraccionamiento estricto de productos (Unidades, Kilogramos, Litros o Metros).
*   **📊 Panel Analítico Inteligente:** Observación de métricas a través de `recharts` para ventas, productos, compras y ganancias.
*   **💸 Punto de Venta Dinámico (TPV/POS):** Interfaz fluida para la gestión de ventas y abonos. Soporte para lectores de código de barras (`html5-qrcode`).
*   **🌙 Interfaz Ultra Premium:** Diseño moderno "glassmorphism", completamente potenciado por TailwindCSS v4 y animado con Framer Motion.
*   **🧬 Arquitectura Atomic Design:** UI estructurada en Átomos, Moléculas y Organismos, garantizando máxima reutilización de código y escalabilidad.

## 🛠️ Tecnologías y Ecosistema

El frontend emplea un stack de herramientas de vanguardia enfocadas en rendimiento y escalabilidad:

*   **[React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/):** Rendering ultrarrápido y Hot Module Replacement (HMR).
*   **[Tailwind CSS v4](https://tailwindcss.com/):** Motor de utilidades CSS moderno (`@tailwindcss/vite`) para construir diseños *Enterprise* a gran velocidad.
*   **[Framer Motion 12](https://www.framer.com/motion/):** Motor declarativo utilizado en transiciones, modales y animaciones del dashboard.
*   **[Zustand 5](https://zustand-demo.pmnd.rs/):** Manejo global del estado asincrónico (con stores independientes para `Auth`, `Productos`, `Ventas`, `Compras`, etc.).
*   **[Axios](https://axios-http.com/):** Cliente HTTP configurado para enviar credenciales (`withCredentials: true`) en todos sus procesos.
*   **[React Router DOM 7](https://reactrouter.com/):** Orquestador de enrutamiento y navegación (SPA).
*   **[Lucide React](https://lucide.dev/):** Tipografía e iconografía semántica moderna.
*   **[Recharts](https://recharts.org/):** Librería para visualización de datos y analíticas interactivas.

## 🚀 Instalación Local / Entorno de Desarrollo

Para iniciar la aplicación en desarrollo, sigue esta guía:

1. **Abriendo la terminal en la carpeta frontend:**
   ```bash
   cd InventarioCrud/frontend
   ```

2. **Instalación de Dependencias:**
   ```bash
   npm install
   ```

3. **Ejecución del Servidor de Desarrollo:**
   *Importante: Verifica que tu Backend (Node/Express) esté corriendo en el puerto correspondiente (usualmente `:5000`) para que el Frontend pueda consumir la API.*
   ```bash
   npm run dev
   ```
   *Accede a `http://localhost:5173` desde tu navegador.*

## 📁 Estructura del Proyecto (Atomic Design)

La estructura sigue un enfoque modular y escalable para separar lógica, presentación y configuración:

```text
frontend/
├── src/
│   ├── assets/                # Recursos estáticos (imágenes, fuentes)
│   ├── components/            # Sistema de Componentes UI (Atomic Design)
│   │   ├── atoms/             # Componentes base (Button, Badge, Input, Spinner)
│   │   ├── molecules/         # Agrupaciones simples (FormField, Modal, StatCard)
│   │   ├── organisms/         # Secciones funcionales (DataTable)
│   │   │
│   │   └── ... Vistas Principales (Managers) ...
│   │       ├── AdminUserCreator.jsx    # Portal privado de alta de usuarios
│   │       ├── ProductManager.jsx      # Panel de CRUD, Inventarios y Mapeo
│   │       ├── SalesManager.jsx        # Punto de Venta POS 
│   │       ├── PurchaseManager.jsx     # Módulo de Entradas y Restock
│   │       ├── CategoryManager.jsx     # Gestor de taxonomías
│   │       ├── StaffManager.jsx        # Gestión del personal/empleados
│   │       ├── AnalyticsManager.jsx    # Panel de métricas y gráficas
│   │       └── BarcodeScanner.jsx      # Escáner de código de barras
│   │
│   ├── pages/                 # Controladores Máster (Vistas completas)
│   │   ├── HomePage.jsx            # Landing / Vitrina principal
│   │   ├── DashboardPage.jsx       # Contexto Privado Maestro y Panel
│   │   ├── LoginPage.jsx           # Autenticación principal
│   │   ├── EmailVerificationPage.jsx # Verificación de correos
│   │   ├── ForgotPasswordPage.jsx  # Recuperación de contraseña (solicitud)
│   │   ├── ResetPasswordPage.jsx   # Recuperación de contraseña (reinicio)
│   │   └── SubscriptionExpiredPage.jsx # Redirección si la cuenta expiró
│   │
│   ├── store/                 # Lógica Pura (Módulos Zustand)
│   ├── styles/                # Tokens de diseño y estilos globales
│   ├── utils/                 # Funciones de ayuda (helpers)
│   ├── constants/             # Variables constantes de la app
│   ├── App.jsx                # Router DOM Principal y Wrappers
│   └── main.jsx               # Entry Point de la aplicación React
├── package.json
└── vite.config.js             # (o similar, configuración de vite)
```

## 🧩 Convenciones y Patrones

1. **Atomic Design:** Separación clara entre componentes de presentación reutilizables (Átomos, Moléculas) y componentes con lógica compleja (Organismos, Managers).
2. **Semántica HTML5:** Uso de etiquetas nativas iterativas (`<section>`, `<article>`, `<dialog>`) en detrimento de los genéricos `<div>`, garantizando accesibilidad y limpieza en el DOM.
3. **Manejo de Estado Centralizado:** Zustand se encarga de la comunicación con la API y el estado global, permitiendo que los componentes se suscriban únicamente a los datos que necesitan.
4. **Flujos de Autenticación Modernos:** Gestión completa de tokens, correos de verificación y recuperación de accesos a través de vistas dedicadas.
5. **Precisión Numérica:** Todo cálculo en el punto de venta y en el sistema de compras utiliza estándares de formato numérico (`min="0.01" step="0.01"`) para manejar de manera precisa el inventario fraccionado.
