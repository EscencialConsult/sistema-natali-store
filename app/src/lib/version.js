// Versión de la app instalada (la pone Vite al compilar: ver vite.config.js). En pruebas y desarrollo no está definida.
/* eslint-disable no-undef */
export const VERSION_APP = typeof __VERSION_APP__ === 'undefined' ? 'desarrollo' : __VERSION_APP__
export const COMPILADA_APP = typeof __COMPILADA_APP__ === 'undefined' ? '' : __COMPILADA_APP__
