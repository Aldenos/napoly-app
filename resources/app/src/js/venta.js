const fs = require('fs');
const resumen = document.getElementById("resumenVenta");
const btnFinalizar = document.getElementById("btnFinalizar");
const btnVolver = document.getElementById("btnVolver");
const audio = document.getElementById("audioDing");
const comandoActivo = document.getElementById("comandoActivo");

let productos = [];
let total = 0;
let buffer = "";
let procesandoVenta = false;

const precios = {
  a: 3.5,
  d: 6,
  g: 9,
  l: 25,
  v: 0.5,
  x: 4,  // Cremolada mediana
  n: 7   // Cremolada grande
};

const nombres = {
  a: "1 Bola",
  d: "2 Bolas",
  g: "3 Bolas",
  l: "Litro",
  v: "Extra (vaso o barquillo)",
  x: "Cremolada mediana",
  n: "Cremolada grande"
};

function actualizarResumen() {
  total = 0;
  resumen.innerHTML = "<h3>Resumen de Venta:</h3><ul>";
  productos.forEach(p => {
    const subt = p.cantidad * p.precio;
    total += subt;
    resumen.innerHTML += `<li>${p.cantidad} x ${nombres[p.tipo]} = S/ ${subt.toFixed(2)}</li>`;
  });
  resumen.innerHTML += `</ul><p><strong>Total: S/ ${total.toFixed(2)}</strong></p>`;
}

document.addEventListener("keydown", e => {
  if (procesandoVenta) return;

  const key = e.key.toLowerCase();
  if (/^[a-z0-9]$/.test(key)) {
    buffer += key;
    comandoActivo.textContent = `Comando actual: ${buffer}`;
    const match = buffer.match(/^(\d{1,3})?([a-z])$/);
    if (match) {
      const cantidad = parseInt(match[1] || "1");
      const tipo = match[2];
      if (tipo === "p") {
        productos.pop();
      } else if (precios[tipo]) {
        const existente = productos.find(p => p.tipo === tipo);
        if (existente) existente.cantidad += cantidad;
        else productos.push({ tipo, cantidad, precio: precios[tipo] });
      }
      actualizarResumen();
      buffer = "";
      comandoActivo.textContent = "";
    }
  } else {
    buffer = "";
    comandoActivo.textContent = "";
  }
});

btnVolver.addEventListener("click", () => window.location.href = "panel.html");

btnFinalizar.addEventListener("click", () => {
  if (procesandoVenta) return;
  procesandoVenta = true;
  btnFinalizar.disabled = true;

  if (productos.length === 0) {
    alert("Agrega al menos un producto.");
    btnFinalizar.disabled = false;
    procesandoVenta = false;
    return;
  }

  const metodoPago = document.getElementById("metodoPago").value;

  const productosDetallados = productos.map(p => ({
    nombre: nombres[p.tipo],
    cantidad: p.cantidad,
    precioUnit: p.precio
  }));

  const venta = {
    productos: productos.map(p => `${p.cantidad} x ${nombres[p.tipo]}`),
    productosDetallados,
    metodoPago,
    total: total.toFixed(2),
    fecha: new Date().toISOString(),
    usuario: localStorage.getItem("usuario")
  };

  const ruta = './ventas.json';
  let ventas = [];
  if (fs.existsSync(ruta)) ventas = JSON.parse(fs.readFileSync(ruta));
  ventas.push(venta);
  fs.writeFileSync(ruta, JSON.stringify(ventas, null, 2));

  localStorage.setItem("ultimaVenta", JSON.stringify(venta));
  audio.play();
  setTimeout(() => window.location.href = "recibo.html", 700);
});