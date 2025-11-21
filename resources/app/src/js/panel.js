const fs = require('fs');

const usuario = localStorage.getItem("usuario");
if (!usuario) window.location.href = "index.html";

document.addEventListener("DOMContentLoaded", () => {
  const btnVenta = document.getElementById("btnRegistrar");
  const btnCerrar = document.getElementById("btnCerrar");
  const btnHistorial = document.getElementById("btnHistorial");

  if (btnVenta) btnVenta.addEventListener("click", () => window.location.href = "venta.html");
  if (btnCerrar) btnCerrar.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });

  if (usuario !== "admin" && btnHistorial) {
    btnHistorial.style.display = "none";
  }

  if (usuario === "admin") {
    const ventas = cargarVentas();
    const ahora = new Date();
    let totalDia = 0, totalAyer = 0, totalSemana = 0, totalMes = 0;
    let totalYape = 0, totalEfectivo = 0;

    ventas.forEach(data => {
      const fecha = new Date(data.fecha);
      const monto = parseFloat(data.total || 0);
      const metodo = (data.metodoPago || "").toLowerCase();

      const mismoDia = fecha.toDateString() === ahora.toDateString();

      const ayer = new Date(ahora);
      ayer.setDate(ahora.getDate() - 1);
      const mismoAyer = fecha.toDateString() === ayer.toDateString();

      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - ahora.getDay());

      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      if (mismoDia) totalDia += monto;
      if (mismoAyer) totalAyer += monto;
      if (fecha >= inicioSemana) totalSemana += monto;
      if (fecha >= inicioMes) totalMes += monto;

      if (metodo === "yape") totalYape += monto;
      else totalEfectivo += monto;
    });

    document.getElementById("estadisticas").innerHTML = `
      <h3>Estadísticas de Ventas</h3>
      <p>Ventas Diarias: S/ ${totalDia.toFixed(2)}</p>
      <p>Ventas Ayer: S/ ${totalAyer.toFixed(2)}</p>
      <p>Ventas Semanales: S/ ${totalSemana.toFixed(2)}</p>
      <p>Ventas Mensuales: S/ ${totalMes.toFixed(2)}</p>
      <hr>
      <p>Total por Yape: S/ ${totalYape.toFixed(2)}</p>
      <p>Total por Efectivo: S/ ${totalEfectivo.toFixed(2)}</p>
      <p><strong>Total General: S/ ${(totalYape + totalEfectivo).toFixed(2)}</strong></p>
    `;

    // === RESUMEN-HOY START: calcular y pintar resumen por producto ===
    try {
      const resumenHoy = construirResumenHoy(ventas, ahora);
      pintarResumenHoy(resumenHoy);
    } catch (e) {
      console.error("Error construyendo Resumen de Hoy:", e);
    }
    // === RESUMEN-HOY END ===
  }
});

function cargarVentas() {
  const path = './ventas.json';
  if (!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path));
}

// === RESUMEN-HOY: utilidades de fecha ===
function esMismoDia(a, b) {
  const da = (a instanceof Date) ? a : new Date(a);
  const db = (b instanceof Date) ? b : new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

// === RESUMEN-HOY: catálogo y clasificadores (por NOMBRE, no por comando) ===
const CATEGORIAS = [
  { key: "h1",      label: "Helados de 1 bola",            matchers: [/(^|[^0-9])1\s*bola(s)?\b/i, /\buna\s*bola\b/i] },
  { key: "h2",      label: "Helados de 2 bolas",           matchers: [/\b2\s*bolas\b/i, /\bdoble\b/i] },
  { key: "h3",      label: "Helados de 3 bolas",           matchers: [/\b3\s*bolas\b/i, /\btriple\b/i] },
  { key: "litro",   label: "Litros",                        matchers: [/\blitro(s)?\b/i] },
  { key: "extra",   label: "Extras (vaso/barquillo)",       matchers: [/\bextra(s)?\b/i, /\bbarquillo(s)?\b/i, /\bvaso(s)?\b/i] },
  { key: "cremo_m", label: "Cremolada mediana",             matchers: [/\bcremolada\s*(mediana|m)\b/i] },
  { key: "cremo_g", label: "Cremolada grande",              matchers: [/\bcremolada\s*(grande|g)\b/i] },
];

function categoriaDeNombre(nombre) {
  if (!nombre) return "otros";
  const text = String(nombre).toLowerCase();
  for (const cat of CATEGORIAS) {
    if (cat.matchers.some(re => re.test(text))) return cat.key;
  }
  return "otros";
}

// ============ EXTRACTOR ACTUALIZADO ============
// Prioriza productosDetallados; luego maneja productos[] (strings "2 x 1 Bola" o "1 Bola")
function extraerItemsDeVenta(venta) {
  // 1) Estructurada: productosDetallados [{nombre, cantidad}]
  if (Array.isArray(venta?.productosDetallados) && venta.productosDetallados.length) {
    return venta.productosDetallados.map(it => ({
      nombre: it.nombre || "",
      cantidad: Number(it.cantidad || 1),
    }));
  }

  // 2) Array productos (puede ser de strings o de objetos)
  if (Array.isArray(venta?.productos) && venta.productos.length) {
    return venta.productos.map(it => {
      if (typeof it === "string") {
        // Formatos aceptados: "2 x 1 Bola", "2x1 Bola", "1 Bola"
        const s = it.trim();
        // a) "2 x 1 Bola" / "2x 1 Bola" / "2x1 Bola"
        let m = s.match(/^(\d+)\s*x\s*(.+)$/i);
        if (!m) m = s.match(/^(\d+)x\s*(.+)$/i);
        if (m) {
          return { cantidad: Number(m[1]), nombre: m[2].trim() };
        }
        // b) "1 Bola" (sin prefijo de cantidad => 1 unidad)
        // también puede venir "3 Bolas" (esto es nombre, no cantidad)
        return { cantidad: 1, nombre: s };
      } else {
        // Objeto con posibles campos {nombre/producto/label/tipo, cantidad}
        return {
          nombre: it.nombre ?? it.producto ?? it.label ?? it.tipo ?? "",
          cantidad: Number(it.cantidad ?? it.qty ?? it.cant ?? 1),
        };
      }
    });
  }

  // 3) Otros arrays comunes
  const arraysPosibles = [venta?.items, venta?.item, venta?.detalle, venta?.detalles];
  for (const arr of arraysPosibles) {
    if (Array.isArray(arr) && arr.length) {
      return arr.map(it => ({
        nombre: it.nombre ?? it.producto ?? it.label ?? it.tipo ?? "",
        cantidad: Number(it.cantidad ?? it.qty ?? it.cant ?? 1),
      }));
    }
  }

  // 4) Texto (ultima opción) — cuenta aproximada
  const txt = [venta?.descripcion, venta?.comandos, venta?.nota, venta?.detalleTexto]
    .filter(Boolean)
    .map(String)
    .join(" . ");
  if (txt.length) {
    const itemsAprox = [];
    for (const cat of CATEGORIAS) {
      let count = 0;
      for (const re of cat.matchers) {
        const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
        const m = txt.match(g);
        if (m) count += m.length;
      }
      if (count > 0) itemsAprox.push({ nombre: cat.label, cantidad: count });
    }
    if (itemsAprox.length === 0) itemsAprox.push({ nombre: "Otros", cantidad: 1 });
    return itemsAprox;
  }

  // 5) Sin datos
  return [{ nombre: "Otros", cantidad: 1 }];
}

function construirResumenHoy(ventas, referenciaFecha) {
  const hoy = ventas.filter(v => {
    const f = v?.fecha ? new Date(v.fecha) : null;
    return f && esMismoDia(f, referenciaFecha);
  });

  const resumen = {
    h1: 0, h2: 0, h3: 0,
    litro: 0,
    extra: 0,
    cremo_m: 0, cremo_g: 0,
    otros: 0,
  };

  for (const venta of hoy) {
    const items = extraerItemsDeVenta(venta);
    for (const it of items) {
      const key = categoriaDeNombre(it.nombre);
      const cant = Number(it.cantidad || 0);
      if (!Number.isFinite(cant) || cant <= 0) continue;
      if (!(key in resumen)) resumen.otros += cant;
      else resumen[key] += cant;
    }
  }

  return resumen;
}

function pintarResumenHoy(resumen) {
  const body = document.getElementById("resumen-hoy-body");
  const totalEl = document.getElementById("resumen-hoy-total");
  if (!body || !totalEl) return;

  const filas = [
    { label: "Helados de 1 bola", value: resumen.h1 },
    { label: "Helados de 2 bolas", value: resumen.h2 },
    { label: "Helados de 3 bolas", value: resumen.h3 },
    { label: "Litros", value: resumen.litro },
    { label: "Cremolada mediana", value: resumen.cremo_m },
    { label: "Cremolada grande", value: resumen.cremo_g },
    { label: "Extras (vaso/barquillo)", value: resumen.extra },
    { label: "Otros", value: resumen.otros },
  ];

  body.innerHTML = filas
    .map(f => `<tr><td>${f.label}</td><td>${f.value}</td></tr>`)
    .join("");

  const total = filas.reduce((s, f) => s + Number(f.value || 0), 0);
  totalEl.textContent = String(total);
}