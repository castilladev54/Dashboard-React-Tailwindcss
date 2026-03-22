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

## 🛠️ Tecnologías y Ecosistema

El frontend emplea un abanico modular de herramientas vanguardistas enfocadas en proveer solidez e instanteneidad al cliente interaccionando con los balances:

*   **[React 18](https://react.dev/) + [Vite](https://vitejs.dev/):** Configuración instantánea y HMR hiperveloz.
*   **[Tailwind CSS v3](https://tailwindcss.com/):** Clases utilitarias que permiten que toda la interfaz haya sido moldeada para verse de categoría *Enterprise*.
*   **[Framer Motion](https://www.framer.com/motion/):** Motor declarativo utilizado en los apartados transicionales, modales flotantes e inputs interactivos en todo el dashboard.
*   **[Zustand](https://zustand-demo.pmnd.rs/):** Manejo global del estado asincrónico separando lógica de la interfaz eficientemente (con stores independientes para `Auth`, `Productos`, `Ventas` y `Tasa de Cambio`).
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

## 📁 Árbol e Ingeniería de Carpetas

```text
frontend/
├── src/
│   ├── components/            # Ladrillos del Sistema UI
│   │   ├── AdminUserCreator.jsx    # Portal privado de alta de usuarios (Suscripción activa automática)
│   │   ├── ProductManager.jsx      # Panel de CRUD, Inventarios y Mapeo de Magnitud
│   │   ├── SalesManager.jsx        # Pantalla central del Punto de Venta POS (Carrito + Fracciones)
│   │   ├── PurchaseManager.jsx     # Modulo de Entrada y Restock de mercadería a Granel
│   │   └── ...                     # Layouts auxiliares, inputs, loading y sidebar.
│   ├── pages/                 # Controladores Máster 
│   │   ├── HomePage.jsx            # Landing / Vitrina ultra-modernizada con Hero Animations
│   │   ├── DashboardPage.jsx       # Contexto Privado Maestro y Enrutador del Panel Interno
│   │   ├── SubscriptionExpiredPage # Redirección punitiva de estado si expire == true
│   │   └── LoginPage.jsx           # Accesibilidad cerrada para usuarios clientes/admins
│   ├── store/                 # Lógica Pura (Módulos Zustand)
│   │   ├── authStore.js            # Base neurálgica de Accesos, Logouts, e interceptores axios 403.
│   │   ├── productStore.js         # Reflejo y asimilamiento del maestro del Backend
│   │   └── ...
│   ├── utils/                 # Funciones Matemáticas o Helpers.
│   ├── App.jsx                # Router DOM Principal y Wrappers Protected/Unprotected
│   └── main.jsx               # Entry Point del framework de React UI.
├── package.json               # Dependencias base
└── tailwind.config.js         # Configurador de tonalidades e inyecciones lógicas de layout oscuro.
```

## 🧩 Patrones Nativos Adoptados (Documentación)

Este Frontend fue sometido a una masiva remodelación para la subida B2B que incluye las siguientes reglas funcionales dictadas por la versión núcleo 2.0 del Backend:

1. El registro público vía `/signup` de usuarios es **inexistente** de cara a los usuarios para frenar robos de software, recayendo 100% el enrolamiento vía `AdminUserCreator`.
2. Todo cálculo e imputación en el TPV ha abandonado validadores numéricos cerrados (ej. `step="1"` clásico de HTML5) para estandarizarse utilizando los atributos de decimales **`min="0.01" step="0.01"`**, permitiéndole a las cajas marcar artículos pesados en balanzas garantizando el pase flotante (ParseFloat) hacia el middleware final.
3. El frontend contiene listeners universales para responder con agilidad a intercepciones por **ausencia autoritaria** (el periodo de pruebas ha extinguido); cancelando transacciones y mostrando de forma punitiva una terminal de alerta visual invitando a la renovación para restablecer el ciclo normal.

---
*Escalable, Responsivo y Extremadamente Estético. Todo diseñado para impresionar.*
