 * @param {Object} result - Resultado del análisis
 * @returns {Array} - Array de recomendaciones
 */
function generateRecommendations(result) {
  const recommendations = [];
  
  if (!result.success) {
    recommendations.push({
      tipo: 'error',
      mensaje: 'No se encontraron todos los materiales necesarios',
      accion: 'Verifica que el modelo GLB contenga materiales llamados "material_manga_izquierda" y "material_manga_derecha"'
    });
  }
  
  if (result.allMaterialNames.length === 0) {
    recommendations.push({
      tipo: 'warning',
      mensaje: 'No se encontraron materiales en el modelo',
      accion: 'Verifica que el modelo tenga materiales asignados en Blender'
    });
  }
  
  if (result.meshCount === 0) {
    recommendations.push({
      tipo: 'error',
      mensaje: 'No se encontraron mallas en el modelo',
      accion: 'Verifica que el modelo contenga geometría válida'
    });
  }
  
  if (result.success) {
    recommendations.push({
      tipo: 'success',
      mensaje: 'Modelo listo para aplicar texturas',
      accion: 'Usa manager.aplicarTextura(url) para añadir logos a las mangas'
    });
  }
  
  return recommendations;
}

// Exportar también una instancia global para uso directo
export const sleevesManager = new SleevesMaterialsManager();