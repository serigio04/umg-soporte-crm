import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Función helper para renderizar Markdown básico a HTML de manera segura.
 */
function renderMarkdown(text) {
  if (!text) return '';
  
  // Escapar HTML para evitar ataques XSS básicos
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Encabezados
  html = html.replace(/^### (.*$)/gim, '<h4 style="margin: 12px 0 6px; color: #1a1a2e; font-size: 15px; font-weight: 600;">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 style="margin: 16px 0 8px; color: #1a1a2e; font-size: 17px; font-weight: 600;">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 style="margin: 20px 0 10px; color: #1a1a2e; font-size: 20px; font-weight: 700;">$1</h2>');
  
  // Negrita
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Cursiva
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Código en línea
  html = html.replace(/`(.*?)`/g, '<code style="background: #f1f2f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #e74c3c;">$1</code>');
  
  // Listas con viñetas
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 4px; list-style-type: disc;">$1</li>');
  
  // Saltos de línea
  html = html.replace(/\n/g, '<br />');
  
  return html;
}

/**
 * Función para renderizar el contenido del artículo.
 * Detecta si el texto ya contiene etiquetas HTML (procedente del editor enriquecido)
 * o si es Markdown clásico y debe ser procesado.
 */
function renderContent(text) {
  if (!text) return '';
  const hasHTML = /<[a-z][\s\S]*>/i.test(text);
  if (hasHTML) {
    return text;
  }
  return renderMarkdown(text);
}

export default function PreguntasFrecuentes() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [activeCategorias, setActiveCategorias] = useState({});
  const [selectedArticulo, setSelectedArticulo] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const navigate = useNavigate();

  // Cargar artículos al montar
  useEffect(() => {
    fetchArticulos();
  }, []);

  async function fetchArticulos(searchQuery = '') {
    setLoading(true);
    setError('');
    try {
      const url = searchQuery ? `/conocimiento?buscar=${encodeURIComponent(searchQuery)}` : '/conocimiento';
      const { data } = await api.get(url);
      setArticulos(data);
      
      // Expandir todas las categorías por defecto al hacer búsqueda
      if (searchQuery) {
        const cats = {};
        data.forEach(art => {
          const catName = art.categoria || 'General';
          cats[catName] = true;
        });
        setActiveCategorias(cats);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los artículos de la Base de Conocimiento.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchArticulos(busqueda);
  }

  function toggleCategoria(cat) {
    setActiveCategorias(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  }

  async function handleOpenArticle(id) {
    setLoadingDetalle(true);
    try {
      const { data } = await api.get(`/conocimiento/${id}`);
      setSelectedArticulo(data);
      
      // Actualizar el contador de visitas localmente en la lista de fondo
      setArticulos(prev => 
        prev.map(art => {
          if (art.idArticulo === id) {
            const currentViews = art.vistas ?? art.views ?? art.total_vistas ?? art.visitas ?? 0;
            return {
              ...art,
              vistas: currentViews + 1,
              views: currentViews + 1,
              total_vistas: currentViews + 1,
              visitas: currentViews + 1
            };
          }
          return art;
        })
      );
    } catch (err) {
      alert('Error al abrir el artículo. Por favor, intenta de nuevo.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  // Agrupar artículos por categoría
  const agrupados = articulos.reduce((acc, art) => {
    const cat = art.categoria || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(art);
    return acc;
  }, {});

  const categorias = Object.keys(agrupados).sort();

  return (
    <div style={styles.page}>
      <style>{`
        .kb-editor-content h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 14px 0 8px;
          font-family: sans-serif;
        }
        .kb-editor-content h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 12px 0 6px;
          font-family: sans-serif;
        }
        .kb-editor-content h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 10px 0 4px;
          font-family: sans-serif;
        }
        .kb-editor-content h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 8px 0 4px;
          font-family: sans-serif;
        }
        .kb-editor-content p {
          font-size: 13.5px;
          line-height: 1.6;
          color: #444;
          margin: 6px 0;
          font-family: sans-serif;
        }
      `}</style>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/estudiante/dashboard')}>
          ← Volver al Dashboard
        </button>
        <span style={styles.headerTitle}>Base de Conocimiento (FAQ)</span>
        <span style={{ width: 100 }} />
      </div>

      <div style={styles.container}>
        {/* Buscador */}
        <div style={styles.searchCard}>
          <h2 style={styles.searchTitle}>¿Cómo podemos ayudarte hoy?</h2>
          <p style={styles.searchSubtitle}>Encuentra respuestas rápidas sobre plataformas, matrículas, pagos y soporte técnico.</p>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Buscar por título, palabra clave o categoría..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <button type="submit" style={styles.searchBtn}>
              🔍 Buscar
            </button>
          </form>
          {busqueda && (
            <button 
              type="button" 
              style={styles.clearBtn} 
              onClick={() => {
                setBusqueda('');
                fetchArticulos('');
              }}
            >
              Ver todos los artículos
            </button>
          )}
        </div>

        {/* Mensajes de Estado */}
        {loading && <p style={styles.infoText}>Cargando preguntas frecuentes...</p>}
        {error && <p style={styles.errorText}>{error}</p>}
        
        {!loading && articulos.length === 0 && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3 style={{ margin: '10px 0 5px', color: '#1a1a2e' }}>No se encontraron respuestas</h3>
            <p style={{ color: '#888', fontSize: '13px' }}>Prueba buscando con palabras clave diferentes o explora otra categoría.</p>
          </div>
        )}

        {/* Lista de Categorías y Artículos */}
        {!loading && articulos.length > 0 && (
          <div style={styles.accordionContainer}>
            {categorias.map(cat => {
              const arts = agrupados[cat];
              const isOpen = !!activeCategorias[cat];
              return (
                <div key={cat} style={styles.categoryGroup}>
                  {/* Accordion Header */}
                  <div 
                    style={{
                      ...styles.accordionHeader,
                      borderBottom: isOpen ? '1px solid #eef0f3' : 'none',
                      borderRadius: isOpen ? '12px 12px 0 0' : '12px'
                    }}
                    onClick={() => toggleCategoria(cat)}
                  >
                    <div style={styles.categoryTitleContainer}>
                      <span style={styles.categoryIcon}>📁</span>
                      <span style={styles.categoryName}>{cat}</span>
                      <span style={styles.categoryCount}>({arts.length})</span>
                    </div>
                    <span style={styles.accordionArrow}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div style={styles.accordionContent}>
                      {arts.map(art => (
                        <div 
                          key={art.idArticulo} 
                          style={styles.articleItem}
                          onClick={() => handleOpenArticle(art.idArticulo)}
                        >
                          <div style={styles.articleLeft}>
                            <span style={styles.articleTitle}>{art.titulo}</span>
                            <div style={styles.articleMeta}>
                              <span style={styles.metaLabel}>👁️ {art.vistas ?? art.views ?? art.total_vistas ?? art.visitas ?? 0} vistas</span>
                              <span style={styles.metaDot}>•</span>
                              <span style={styles.metaLabel}>ID: #{art.idArticulo}</span>
                            </div>
                          </div>
                          <span style={styles.articleArrow}>→</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalle de Artículo */}
      {selectedArticulo && (
        <div style={styles.modalOverlay} onClick={() => setSelectedArticulo(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalCategoryBadge}>{selectedArticulo.categoria || 'General'}</span>
                <h3 style={styles.modalTitle}>{selectedArticulo.titulo}</h3>
                <p style={styles.modalViews}>👁️ {selectedArticulo.vistas ?? selectedArticulo.views ?? selectedArticulo.total_vistas ?? selectedArticulo.visitas ?? 0} visualizaciones</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedArticulo(null)}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              <div 
                className="kb-editor-content"
                style={styles.articleBodyContent}
                dangerouslySetInnerHTML={{ __html: renderContent(selectedArticulo.contenidoMarkdown || selectedArticulo.contenido) }}
              />
            </div>
            
            <div style={styles.modalFooter}>
              <button style={styles.closeFooterBtn} onClick={() => setSelectedArticulo(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loader de Detalle Overlay */}
      {loadingDetalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.loaderContainer}>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: '500' }}>Cargando artículo...</p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { 
    minHeight: '100vh', 
    background: '#f4f7f6', 
    fontFamily: 'sans-serif' 
  },
  header: { 
    background: '#1a1a2e', 
    color: '#fff', 
    padding: '1rem 2rem', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  headerTitle: { 
    fontWeight: '600', 
    fontSize: '16px' 
  },
  backBtn: { 
    background: 'transparent', 
    border: '1px solid rgba(255,255,255,0.3)', 
    color: '#fff', 
    padding: '7px 14px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '13px',
    transition: 'all 0.2s'
  },
  container: { 
    maxWidth: '800px', 
    margin: '2rem auto', 
    padding: '0 1.5rem' 
  },
  searchCard: { 
    background: '#fff', 
    borderRadius: '16px', 
    padding: '2.5rem 2rem', 
    textAlign: 'center', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
    marginBottom: '2rem'
  },
  searchTitle: { 
    fontSize: '22px', 
    fontWeight: '700', 
    color: '#1a1a2e', 
    margin: '0 0 8px 0' 
  },
  searchSubtitle: { 
    fontSize: '13px', 
    color: '#666', 
    margin: '0 0 20px 0',
    lineHeight: '1.5'
  },
  searchForm: { 
    display: 'flex', 
    gap: '10px', 
    maxWidth: '600px', 
    margin: '0 auto' 
  },
  searchInput: { 
    flex: 1, 
    padding: '12px 16px', 
    borderRadius: '10px', 
    border: '1px solid #ddd', 
    fontSize: '14px', 
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
  },
  searchBtn: { 
    padding: '12px 24px', 
    background: '#1a1a2e', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '14px', 
    fontWeight: '500', 
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#2980b9',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
    marginTop: '12px'
  },
  infoText: { 
    textAlign: 'center', 
    color: '#666', 
    fontSize: '14px', 
    padding: '2rem 0' 
  },
  errorText: { 
    textAlign: 'center', 
    color: '#c0392b', 
    fontSize: '14px', 
    padding: '2rem 0' 
  },
  emptyState: { 
    textAlign: 'center', 
    padding: '3rem 2rem', 
    background: '#fff', 
    borderRadius: '16px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.04)' 
  },
  accordionContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px' 
  },
  categoryGroup: { 
    background: '#fff', 
    borderRadius: '12px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    overflow: 'hidden'
  },
  accordionHeader: { 
    padding: '1.25rem 1.5rem', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    cursor: 'pointer',
    background: '#fff',
    userSelect: 'none',
    transition: 'background 0.2s'
  },
  categoryTitleContainer: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px' 
  },
  categoryIcon: { 
    fontSize: '18px' 
  },
  categoryName: { 
    fontSize: '15px', 
    fontWeight: '600', 
    color: '#1a1a2e' 
  },
  categoryCount: { 
    fontSize: '13px', 
    color: '#888' 
  },
  accordionArrow: { 
    fontSize: '12px', 
    color: '#aaa' 
  },
  accordionContent: { 
    padding: '8px 1.5rem', 
    background: '#fafbfc',
    borderTop: '1px solid #f1f3f5'
  },
  articleItem: { 
    padding: '12px 0', 
    borderBottom: '1px solid #f1f3f5', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    cursor: 'pointer',
    transition: 'padding-left 0.2s'
  },
  articleLeft: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px' 
  },
  articleTitle: { 
    fontSize: '14px', 
    fontWeight: '500', 
    color: '#333' 
  },
  articleMeta: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  },
  metaLabel: { 
    fontSize: '11px', 
    color: '#888' 
  },
  metaDot: { 
    fontSize: '8px', 
    color: '#ccc' 
  },
  articleArrow: { 
    fontSize: '14px', 
    color: '#ccc',
    transition: 'transform 0.2s'
  },
  modalOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(0,0,0,0.5)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1000,
    padding: '1rem'
  },
  modalCard: { 
    background: '#fff', 
    borderRadius: '16px', 
    width: '100%', 
    maxWidth: '650px', 
    maxHeight: '90vh',
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    animation: 'modalOpen 0.25s ease-out'
  },
  modalHeader: { 
    padding: '1.5rem', 
    borderBottom: '1px solid #eee', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    gap: '15px'
  },
  modalCategoryBadge: { 
    fontSize: '10px', 
    textTransform: 'uppercase', 
    fontWeight: '700', 
    color: '#2980b9', 
    background: 'rgba(41, 128, 185, 0.1)', 
    padding: '3px 8px', 
    borderRadius: '4px',
    display: 'inline-block',
    marginBottom: '8px'
  },
  modalTitle: { 
    fontSize: '18px', 
    fontWeight: '700', 
    color: '#1a1a2e', 
    margin: 0 
  },
  modalViews: { 
    fontSize: '12px', 
    color: '#888', 
    margin: '4px 0 0 0' 
  },
  closeBtn: { 
    background: 'transparent', 
    border: 'none', 
    fontSize: '18px', 
    color: '#888', 
    cursor: 'pointer',
    padding: '4px 8px'
  },
  modalBody: { 
    padding: '1.5rem', 
    overflowY: 'auto', 
    flex: 1,
    lineHeight: '1.6',
    color: '#444'
  },
  articleBodyContent: {
    fontSize: '14.5px',
  },
  modalFooter: { 
    padding: '1rem 1.5rem', 
    borderTop: '1px solid #eee', 
    display: 'flex', 
    justifyContent: 'flex-end' 
  },
  closeFooterBtn: { 
    padding: '8px 20px', 
    background: '#1a1a2e', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '13px', 
    cursor: 'pointer',
    fontWeight: '500'
  },
  loaderContainer: { 
    background: 'rgba(0,0,0,0.8)', 
    padding: '15px 30px', 
    borderRadius: '8px' 
  }
};
