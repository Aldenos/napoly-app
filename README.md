# Napoly App

Aplicación de escritorio para gestión de ventas de Napoly Heladería, desarrollada con Electron.

## Características

- 📊 Gestión de ventas
- 📋 Panel de control
- 🧾 Generación de recibos
- 📱 Interfaz intuitiva

## Requisitos previos

- Node.js 16.0 o superior
- npm o yarn

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/Aldenos/napoly-app.git
cd napoly-app
```

2. Instala las dependencias:
```bash
cd resources/app
npm install
```

## Uso

Para ejecutar la aplicación en desarrollo:
```bash
npm start
```

Para empaquetar la aplicación como ejecutable:
```bash
npm run package
```

El archivo generado estará en la carpeta `dist/`.

## Estructura del proyecto

```
resources/app/
├── main.js           # Proceso principal de Electron
├── preload.js        # Script de precarga
├── package.json      # Dependencias
└── src/
    ├── index.html    # Página principal
    ├── panel.html    # Panel de control
    ├── venta.html    # Pantalla de ventas
    ├── recibo.html   # Generador de recibos
    ├── db.js         # Lógica de base de datos
    ├── css/
    │   └── style.css # Estilos
    └── js/
        ├── login.js  # Autenticación
        ├── panel.js  # Lógica del panel
        └── venta.js  # Lógica de ventas
```

## Licencia

MIT - Ver archivo LICENSE para más detalles

## Autor

Aldo Zavala
