// src/js/db.js
import fs from 'fs';

const path = './ventas.json';

export function guardarVenta(venta) {
  let data = [];
  if (fs.existsSync(path)) {
    data = JSON.parse(fs.readFileSync(path));
  }
  data.push(venta);
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

export function obtenerVentas() {
  if (!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path));
}