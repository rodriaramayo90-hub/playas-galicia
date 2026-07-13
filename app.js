const playas = [
  { nombre: "Samil", puntuacion: 87 },
  { nombre: "Playa América", puntuacion: 84 },
  { nombre: "Barra", puntuacion: 82 }
];

const tabla = document.getElementById("ranking");

playas.forEach((playa, index) => {
  tabla.innerHTML += `
    <tr>
      <td>${index + 1}</td>
      <td>${playa.nombre}</td>
      <td>${playa.puntuacion}</td>
    </tr>
  `;
});