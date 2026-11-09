// Error controlado de la capa de IA: lleva el estado HTTP que debe devolver la API.
export class ErrorIA extends Error {
  /** @param {502 | 504} estado */
  constructor(estado, mensaje) {
    super(mensaje);
    this.name = 'ErrorIA';
    this.estado = estado;
  }
}
