# 🛒 CastillaWeb - Sistema POS e Inventario (SaaS Frontend v2.0)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/zustand-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Framer Motion](https://img.shields.io/badge/Framer--Motion-black?style=for-the-badge&logo=framer&logoColor=blue)

CastillaWeb es el **Frontend** de una plataforma de inventario y punto de venta integral tipo SaaS (Software as a Service). Está diseñado para proporcionar la mejor experiencia de usuario (UX) mediante animaciones fluidas, un modo oscuro espectacular, y robustas capacidades para manejar comercios corporativos (desde tiendas pequeñas hasta supermercados que registran ventas fraccionales a granel).

## ✨ Características Principales (Actualización v2.0)

*   **🛡️ Sistema SaaS Cerrado (B2B):** El acceso público y el autorregistro están desactivados por seguridad. Las cuentas son generadas exclusivamente y entregadas centralizadamente por el administrador de la plataforma mediante un panel interno (`AdminUserCreator.jsx`).
*   **⏳ Interceptor de Suscripciones (7 Días):** Integración de un interceptor de red global (`Axios`) que captura cortes de caducidad provenientes del servidor de manera instantánea. Si un plan o trial concluye, el framework detiene de inmediato el parseo de vistas y encierra toda la aplicación detrás del portal ineludible **`SubscriptionExpiredPage`**.
*   **⚖️ Ventas y Stock a Granel (Inventario Multiescala):** Total soporte para manejo y fraccionamiento estricto de productos por diferentes magnitudes (Unidades, Kilogramos (kg), Litros (litro) o Metros (metro)). Los formularios pueden procesar de manera natural entradas en centésimas (`0.01`).
*   **📊 Panel Analítico Inteligente:** Observación en tiempo real de márgenes de ganancias, productos más vendidos y recuentos de utilidades.
*   **💸 Punto de Venta Dinámico (TPV/POS):** Tasa de cambio editable de manera asíncrona directamente desde el layout de ventas para transformar visualizaciones entre USD y moneda local en cuestión de décimas de segundo, sin recargar páginas. 
*   **🌙 Interfaz Ultra Premium y Moderna:** Diseño fluido y responsivo que aprovecha toda la modernidad del "glassmorphism", tonalidades neón sobre fondos obsidianos (Amber/Orange highlight), completamente potenciado por TailwindCSS y Framer Motion.
*   **🧬 Arquitectura Atomic Design:** Reciente refactorización profunda para estructurar la UI en Átomos, Moléculas y Organismos, garantizando máxima reutilización de código y escalabilidad.

## 🛠️ Tecnologías y Ecosistema

El frontend emplea un abanico modular de herramientas vanguardistas enfocadas en proveer solidez e instanteneidad al cliente interaccionando con los balances:

*   **[React 18](https://react.dev/) + [Vite](https://vitejs.dev/):** Configuración instantánea y HMR hiperveloz.
*   **[Tailwind CSS v3](https://tailwindcss.com/):** Clases utilitarias que permiten que toda la interfaz haya sido moldeada para verse de categoría *Enterprise*.
*   **[Framer Motion](https://www.framer.com/motion/):** Motor declarativo utilizado en los apartados transicionales, modales flotantes e inputs interactivos en todo el dashboard.
*   **[Zustand](https://zustand-demo.pmnd.rs/):** Manejo global del estado asincrónico separando lógica de la interfaz eficientemente (con stores independientes para `Auth`, `Productos`, `Ventas`, `Compras`, `Ajustes` y `Tasa de Cambio`).
*   **[Axios](https://axios-http.com/):** Módulo de consultas backend adaptado para llevar siempre las galletas (`withCredentials: true`) en todos sus procesos bajo los scopes de API interna.
*   **[React Router DOM](https://reactrouter.com/):** Orquestador de vistas (SPA layout).
*   **[Lucide React](https://lucide.dev/):** Tipografía e iconografía semántica de trazos limpios.

## 🚀 Instalación Local / Entorno de Desarrollo

Para poner a marchar la aplicación en desarrollo, sigue esta guía básica:

1. **Abriendo la raíz en terminal:**
   ```bash
   cd InventarioCrud/frontend
   ```

2. **Instalación de Módulos (NPM/Yarn):**
   ```bash
   npm install
   ```

3. **Ejecución del Motor (Vite Server):**
   *Importante: Verifica que en paralelo tu Backend corriendo bajo Node/Express en el puerto `:5000` se encuentre encendido, o de lo contrario el Frontend no podrá efectuar intercesiones API ni autenticarte.*
   ```bash
   npm run dev
   ```
   *Accede ahora a `http://localhost:5173` desde cualquier navegador para disfrutar todo el entorno CastillaWeb*.

## 📁 Árbol e Ingeniería de Carpetas (Atomic Design)

La estructura del proyecto fue refactorizada recientemente para seguir los principios de **Atomic Design**, creando una base de código mucho más mantenible y limpia, reduciendo el tamaño de las vistas principales en casi un 50%.

```text
frontend/
├── src/
│   ├── components/            # Sistema de Componentes UI (Atomic Design)
│   │   ├── atoms/             # Componentes indivisibles (Button, Badge, Input, Spinner, Label)
│   │   ├── molecules/         # Agrupaciones simples (FormField, SectionHeader, ConfirmDialog, Modal, StatCard)
│   │   ├── organisms/         # Secciones funcionales complejas (DataTable)
│   │   │
│   │   └── ...Vistas Principales (Managers)...
│   │       ├── AdminUserCreator.jsx    # Portal privado de alta de usuarios
│   │       ├── ProductManager.jsx      # Panel de CRUD, Inventarios y Mapeo
│   │       ├── SalesManager.jsx        # Punto de Venta POS (POS fullscreen, Carrito, Catálogo, Scanner)
│   │       ├── PurchaseManager.jsx     # Modulo de Entrada y Restock a Granel
│   │       ├── CategoryManager.jsx     # Gestor de taxonomías
│   │       ├── AdjustmentManager.jsx   # Kárdex y auditorías manuales (Mermas, Daños, Correcciones)
│   │       └── AnalyticsManager.jsx    # Panel de métricas y gráficas (Recharts)
│   │
│   ├── pages/                 # Controladores Máster 
│   │   ├── HomePage.jsx            # Landing / Vitrina ultra-modernizada con Hero Animations
│   │   ├── DashboardPage.jsx       # Contexto Privado Maestro y Enrutador del Panel Interno
│   │   ├── SubscriptionExpiredPage # Redirección si expire == true
│   │   └── LoginPage.jsx           # Accesibilidad cerrada para usuarios clientes/admins
│   │
│   ├── store/                 # Lógica Pura (Módulos Zustand)
│   │   ├── authStore.js            # Accesos, Logouts, e interceptores axios 403.
│   │   ├── productStore.js         # Reflejo del maestro del Backend
│   │   ├── saleStore.js            # Ventas y reportes
│   │   └── ...
│   │
│   ├── styles/                # Tokens de diseño compartidos
│   ├── utils/                 # Funciones matemáticas o helpers
│   ├── App.jsx                # Router DOM Principal y Wrappers Protected/Unprotected
│   └── main.jsx               # Entry Point del framework de React UI.
├── package.json
└── tailwind.config.js
```

## 🧩 Patrones Nativos Adoptados (Documentación)

1. **Atomic Design & DRY:** Todos los componentes monolíticos (`SalesManager`, `PurchaseManager`, etc.) delegan la presentación de tablas, modales destructivos y formularios a la taxonomía atómica (`DataTable`, `ConfirmDialog`, `FormField`).
2. **Registro Centralizado:** El registro público vía `/signup` de usuarios es **inexistente**. El enrolamiento recae 100% sobre `AdminUserCreator.jsx` para evitar abusos B2C.
3. **Punto Flotante a Granel:** Todo cálculo e imputación en el TPV utiliza `min="0.01" step="0.01"`, permitiendo a las cajas marcar artículos pesados en balanzas garantizando el pase flotante (ParseFloat) hacia el middleware final.
4. **Semántica HTML5:** Se usan etiquetas nativas iterativas (`<section>`, `<fieldset>`, `<article>`, `<output>`, etiquetas `aria-*`) en detrimento de los genéricos `<div>`, garantizando accesibilidad (a11y) y limpieza de árbol DOM.
5. **Shortcuts & UX TPV:** El `SalesManager` incorpora un potente listener nativo para que los cajeros puedan orquestar el Punto de Venta con atajos de teclado completos (F2, F3, F4, Scanner Pasivo, etc) sin utilizar el mouse.
6. **Listener de Expiración:** Interceptores universales responden de agilidad a mermas autoritarias (periodo de pruebas extinto), aislando al aplicativo y mostrando una pantalla de suspensión de servicio instintiva.

---
*Escalable, Responsivo y Extremadamente Estético. Todo diseñado para impresionar.*
