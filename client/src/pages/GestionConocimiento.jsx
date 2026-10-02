import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GestionConocimiento() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  
  // Filtro de búsqueda local para la tabla
  const [filtroTabla, setFiltroTabla] = useState('');

  // Estados para el Modal de Formulario (Crear/Editar)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = Crear, number = Editar
  const [formTitulo, setFormTitulo] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formContenido, setFormContenido] = useState(''); // Contiene el HTML formateado del editor
  const [guardando, setGuardando] = useState(false);
  const [dropdownFormatoAbierto, setDropdownFormatoAbierto] = useState(false);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState('Texto Normal');

  // Ref para el editor visual contentEditable
  const editorRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticulos();
  }, []);

  // Sincronizar el contenido del editor visual cuando se abre el modal o cambia el artículo editado
  useEffect(() => {
    if (modalAbierto && editorRef.current) {
      editorRef.current.innerHTML = formContenido;
    }
  }, [modalAbierto, editingId]);

  async function fetchArticulos() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/conocimiento');
      setArticulos(data);
    } catch (err) {
      console.error(err);
      setError('Error al obtener la lista de artículos.');
    } finally {
      setLoading(false);
    }
  }

  // Obtener categorías únicas para el datalist de sugerencias
  const categoriasExistentes = Array.from(
    new Set(articulos.map(art => art.categoria).filter(Boolean))
  ).sort();

  function abrirModalCrear() {
    setEditingId(null);
    setFormTitulo('');
    setFormCategoria('');
    setFormContenido('');
    setMensajeExito('');
    setError('');
    setDropdownFormatoAbierto(false);
    setFormatoSeleccionado('Texto Normal');
    setModalAbierto(true);
  }

  function abrirModalEditar(articulo) {
    setEditingId(articulo.idArticulo);
    setFormTitulo(articulo.titulo);
    setFormCategoria(articulo.categoria || '');
    // Soporta tanto la columna corregida como la anterior por compatibilidad
    setFormContenido(articulo.contenidoMarkdown || articulo.contenido || '');
    setMensajeExito('');
    setError('');
    setDropdownFormatoAbierto(false);
    setFormatoSeleccionado('Texto Normal');
    setModalAbierto(true);
  }

  // Funciones de formateo del editor visual
  function handleEditorCommand(command, value = null) {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setFormContenido(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  }

  function handleFormatBlock(tagName) {
    document.execCommand('formatBlock', false, `<${tagName}>`);
    if (editorRef.current) {
      setFormContenido(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  }

  function handleEditorInput() {
    if (editorRef.current) {
      setFormContenido(editorRef.current.innerHTML);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Validar estados de React antes de enviar la petición Axios
    if (!formTitulo.trim()) return setError('El título es requerido.');
    if (!formCategoria.trim()) return setError('La categoría es requerida.');
    
    // Limpieza básica para evitar guardar espacios en blanco de HTML
    const contenidoLimpio = formContenido.replace(/<br>/g, '').replace(/&nbsp;/g, '').trim();
    if (!contenidoLimpio || formContenido === '<div><br></div>') {
      return setError('El contenido del artículo es requerido.');
    }

    setGuardando(true);
    try {
      // Mapear exactamente las llaves del payload esperadas por el backend de Neon
      const payload = {
        titulo: formTitulo,
        categoria: formCategoria,
        contenidoMarkdown: formContenido // Envía el contenido enriquecido/HTML
      };

      if (editingId) {
        // Petición PUT
        await api.put(`/conocimiento/${editingId}`, payload);
        setMensajeExito('Artículo actualizado con éxito.');
      } else {
        // Petición POST
        await api.post('/conocimiento', payload);
        setMensajeExito('Artículo creado con éxito.');
      }

      setModalAbierto(false);
      fetchArticulos();
      
      // Limpiar mensaje de éxito tras 3 segundos
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar el artículo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id, titulo) {
    const seguro = window.confirm(`¿Estás seguro de que deseas eliminar el artículo "${titulo}"?`);
    if (!seguro) return;

    setError('');
    try {
      await api.delete(`/conocimiento/${id}`);
      setMensajeExito('Artículo eliminado correctamente.');
      fetchArticulos();
      
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al eliminar el artículo.');
    }
  }

  // Filtrar artículos localmente para la visualización de la tabla
  const articulosFiltrados = articulos.filter(art => {
    const term = filtroTabla.toLowerCase();
    return (
      art.titulo.toLowerCase().includes(term) ||
      (art.categoria || '').toLowerCase().includes(term) ||
      art.idArticulo.toString().includes(term)
    );
  });

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
        .kb-editor-content:empty:before {
          content: 'Escribe el contenido del artículo aquí...';
          color: #bbb;
          font-style: italic;
        }
        .kb-dropdown-menu {
          position: absolute;
          top: 32px;
          left: 0;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 100;
          display: flex;
          flex-direction: column;
          min-width: 140px;
          padding: 4px 0;
          box-sizing: border-box;
        }
        .kb-dropdown-item {
          background: transparent;
          border: none;
          padding: 8px 12px;
          font-size: 12.5px;
          color: #333;
          text-align: left;
          cursor: pointer;
          width: 100%;
          font-family: sans-serif;
          transition: background 0.15s;
          box-sizing: border-box;
        }
        .kb-dropdown-item:hover {
          background-color: #f1f3f5;
          color: #1a1a2e;
        }
      `}</style>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/agente/dashboard')}>
          ← Dashboard Agente
        </button>
        <span style={styles.headerTitle}>Panel de Gestión: Base de Conocimiento</span>
        <button style={styles.crearBtn} onClick={abrirModalCrear}>
          ➕ Nuevo Artículo
        </button>
      </div>

      <div style={styles.container}>
        {/* Alertas */}
        {mensajeExito && <div style={styles.successAlert}>{mensajeExito}</div>}
        {error && <div style={styles.errorAlert}>{error}</div>}

        {/* Buscador y Metadatos */}
        <div style={styles.controlsRow}>
          <input
            type="text"
            style={styles.tableFilterInput}
            placeholder="Filtrar por ID, título o categoría..."
            value={filtroTabla}
            onChange={e => setFiltroTabla(e.target.value)}
          />
          <span style={styles.counterText}>
            {articulosFiltrados.length} artículo(s) encontrado(s)
          </span>
        </div>

        {/* Tabla */}
        <div style={styles.tableWrapper}>
          {loading ? (
            <p style={styles.loadingText}>Cargando lista de artículos...</p>
          ) : articulosFiltrados.length === 0 ? (
            <p style={styles.loadingText}>No se encontraron artículos.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Vistas</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {articulosFiltrados.map(art => (
                  <tr key={art.idArticulo} style={styles.tr}>
                    <td style={styles.td}>#{art.idArticulo}</td>
                    <td style={{ ...styles.td, fontWeight: '500', color: '#1a1a2e' }}>{art.titulo}</td>
                    <td style={styles.td}>
                      <span style={styles.categoryBadge}>{art.categoria || 'General'}</span>
                    </td>
                    <td style={styles.td}>
                      👁️ {art.vistas ?? art.views ?? art.total_vistas ?? art.visitas ?? 0}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={styles.actionsGroup}>
                        <button 
                          style={styles.editBtn} 
                          onClick={() => abrirModalEditar(art)}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          style={styles.deleteBtn} 
                          onClick={() => handleEliminar(art.idArticulo, art.titulo)}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal CRUD de Crear/Editar */}
      {modalAbierto && (
        <div style={styles.modalOverlay} onClick={() => setModalAbierto(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingId ? 'Editar Artículo' : 'Nuevo Artículo de Soporte'}
              </h3>
              <button style={styles.closeBtn} onClick={() => setModalAbierto(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.modalBody}>
                {/* Título */}
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Título del Artículo *</label>
                  <input
                    type="text"
                    style={styles.formInput}
                    placeholder="Ej: ¿Cómo restablecer mi contraseña institucional?"
                    value={formTitulo}
                    onChange={e => setFormTitulo(e.target.value)}
                    required
                  />
                </div>

                {/* Categoría */}
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Categoría *</label>
                  <input
                    type="text"
                    list="categorias-sugeridas"
                    style={styles.formInput}
                    placeholder="Selecciona o escribe una nueva..."
                    value={formCategoria}
                    onChange={e => setFormCategoria(e.target.value)}
                    required
                  />
                  <datalist id="categorias-sugeridas">
                    {categoriasExistentes.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <span style={styles.formHint}>Sugerencia: Elige una existente o escribe una nueva para agrupar las preguntas de forma coherente.</span>
                </div>

                {/* Contenido (Editor de Texto Enriquecido Visual) */}
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Contenido del Artículo *</label>
                  
                  {/* Barra de Herramientas Visual del Editor */}
                  <div style={styles.toolbar}>
                    <button 
                      type="button" 
                      style={styles.toolbarBtn} 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleEditorCommand('bold');
                      }}
                      title="Negrita"
                    >
                      <b>B</b>
                    </button>
                    <button 
                      type="button" 
                      style={styles.toolbarBtn} 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleEditorCommand('italic');
                      }}
                      title="Cursiva"
                    >
                      <i>I</i>
                    </button>
                    <div style={styles.toolbarSeparator} />
                    
                    {/* Selector de Formato Personalizado que previene pérdida de foco */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        type="button"
                        style={{ ...styles.toolbarBtn, minWidth: '130px', justifyContent: 'space-between', padding: '4px 10px' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setDropdownFormatoAbierto(!dropdownFormatoAbierto);
                        }}
                        title="Formato de texto"
                      >
                        <span>{formatoSeleccionado}</span>
                        <span style={{ fontSize: '9px', marginLeft: '6px' }}>▼</span>
                      </button>
                      {dropdownFormatoAbierto && (
                        <div className="kb-dropdown-menu">
                          <button
                            type="button"
                            className="kb-dropdown-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleFormatBlock('p');
                              setFormatoSeleccionado('Texto Normal');
                              setDropdownFormatoAbierto(false);
                            }}
                          >
                            Texto Normal
                          </button>
                          <button
                            type="button"
                            className="kb-dropdown-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleFormatBlock('h1');
                              setFormatoSeleccionado('Título (H1)');
                              setDropdownFormatoAbierto(false);
                            }}
                          >
                            Título (H1)
                          </button>
                          <button
                            type="button"
                            className="kb-dropdown-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleFormatBlock('h2');
                              setFormatoSeleccionado('Subtítulo (H2)');
                              setDropdownFormatoAbierto(false);
                            }}
                          >
                            Subtítulo (H2)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Componente contentEditable */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    style={styles.editor}
                    className="kb-editor-content"
                  />
                  <span style={styles.formHint}>Usa la barra de herramientas superior para aplicar formatos visuales directamente al texto.</span>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  style={styles.cancelBtn} 
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ ...styles.submitBtn, opacity: guardando ? 0.7 : 1 }}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { 
    minHeight: '100vh', 
    background: '#f4f4f4', 
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
    fontWeight: '500', 
    fontSize: '15px' 
  },
  backBtn: { 
    background: 'transparent', 
    border: '1px solid rgba(255,255,255,0.3)', 
    color: '#fff', 
    padding: '6px 14px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '13px',
    transition: 'all 0.2s'
  },
  crearBtn: { 
    background: '#27ae60', 
    color: '#fff', 
    border: 'none', 
    padding: '8px 16px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '13px', 
    fontWeight: '500',
    transition: 'background 0.2s'
  },
  container: { 
    maxWidth: '1000px', 
    margin: '2rem auto', 
    padding: '0 1.5rem' 
  },
  successAlert: { 
    background: '#2ecc71', 
    color: '#fff', 
    padding: '10px 15px', 
    borderRadius: '8px', 
    fontSize: '13px', 
    marginBottom: '1.5rem',
    fontWeight: '500' 
  },
  errorAlert: { 
    background: '#e74c3c', 
    color: '#fff', 
    padding: '10px 15px', 
    borderRadius: '8px', 
    fontSize: '13px', 
    marginBottom: '1.5rem',
    fontWeight: '500' 
  },
  controlsRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '1rem',
    gap: '15px',
    flexWrap: 'wrap'
  },
  tableFilterInput: { 
    padding: '8px 14px', 
    borderRadius: '8px', 
    border: '1px solid #ddd', 
    fontSize: '13px', 
    width: '100%', 
    maxWidth: '300px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  counterText: { 
    fontSize: '13px', 
    color: '#666' 
  },
  tableWrapper: { 
    background: '#fff', 
    borderRadius: '12px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
    overflowX: 'auto',
    padding: '0.5rem'
  },
  loadingText: { 
    textAlign: 'center', 
    color: '#aaa', 
    fontSize: '13px', 
    padding: '2rem 0' 
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    textAlign: 'left',
    fontSize: '13px'
  },
  th: { 
    padding: '12px 16px', 
    borderBottom: '2px solid #eef0f3', 
    color: '#555', 
    fontWeight: '600' 
  },
  tr: { 
    borderBottom: '1px solid #f1f3f5',
    transition: 'background 0.15s'
  },
  td: { 
    padding: '12px 16px', 
    color: '#555',
    verticalAlign: 'middle'
  },
  categoryBadge: { 
    fontSize: '11px', 
    background: '#eee', 
    color: '#1a1a2e', 
    padding: '3px 8px', 
    borderRadius: '20px', 
    fontWeight: '500' 
  },
  actionsGroup: { 
    display: 'flex', 
    gap: '8px', 
    justifyContent: 'center' 
  },
  editBtn: { 
    background: 'transparent', 
    border: '1px solid #3498db', 
    color: '#3498db', 
    padding: '4px 10px', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontSize: '12px',
    transition: 'all 0.2s'
  },
  deleteBtn: { 
    background: 'transparent', 
    border: '1px solid #e74c3c', 
    color: '#e74c3c', 
    padding: '4px 10px', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontSize: '12px',
    transition: 'all 0.2s'
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
    borderRadius: '12px', 
    width: '100%', 
    maxWidth: '600px', 
    maxHeight: '90vh',
    display: 'flex', 
    flexDirection: 'column', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
  },
  modalHeader: { 
    padding: '1.25rem 1.5rem', 
    borderBottom: '1px solid #eee', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  modalTitle: { 
    fontSize: '15px', 
    fontWeight: '600', 
    color: '#1a1a2e', 
    margin: 0 
  },
  closeBtn: { 
    background: 'transparent', 
    border: 'none', 
    fontSize: '16px', 
    color: '#888', 
    cursor: 'pointer' 
  },
  modalForm: { 
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden', 
    flex: 1 
  },
  modalBody: { 
    padding: '1.5rem', 
    overflowY: 'auto', 
    flex: 1 
  },
  formField: { 
    marginBottom: '1.25rem' 
  },
  formLabel: { 
    display: 'block', 
    fontSize: '13px', 
    fontWeight: '500', 
    color: '#444', 
    marginBottom: '6px' 
  },
  formInput: { 
    width: '100%', 
    padding: '10px 12px', 
    borderRadius: '8px', 
    border: '1px solid #ddd', 
    fontSize: '13px', 
    boxSizing: 'border-box',
    outline: 'none'
  },
  formHint: { 
    display: 'block', 
    fontSize: '11px', 
    color: '#aaa', 
    marginTop: '4px', 
    lineHeight: '1.3' 
  },
  modalFooter: { 
    padding: '1rem 1.5rem', 
    borderTop: '1px solid #eee', 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: '10px' 
  },
  cancelBtn: { 
    padding: '8px 16px', 
    background: 'transparent', 
    border: '1px solid #ddd', 
    borderRadius: '8px', 
    color: '#555', 
    cursor: 'pointer', 
    fontSize: '13px' 
  },
  submitBtn: { 
    padding: '8px 18px', 
    background: '#1a1a2e', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '13px', 
    fontWeight: '500' 
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '8px 8px 0 0',
    padding: '8px 12px',
    borderBottom: 'none',
    boxSizing: 'border-box'
  },
  toolbarBtn: {
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#333',
    fontWeight: 'normal',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '28px',
    boxSizing: 'border-box'
  },
  toolbarSeparator: {
    width: '1px',
    height: '18px',
    background: '#ccc',
    margin: '0 4px'
  },
  toolbarSelect: {
    height: '28px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    background: '#fff',
    color: '#333',
    fontSize: '12px',
    padding: '0 4px',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'sans-serif'
  },
  editor: {
    minHeight: '200px',
    maxHeight: '350px',
    border: '1px solid #ddd',
    borderRadius: '0 0 8px 8px',
    padding: '12px',
    fontSize: '14px',
    lineHeight: '1.6',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#fff',
    fontFamily: 'sans-serif',
    overflowY: 'auto',
    textAlign: 'left'
  }
};
