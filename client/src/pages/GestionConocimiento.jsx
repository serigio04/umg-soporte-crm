import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/molecules/Pagination';
import api from '../services/api';

const PAGE_SIZE = 15;

function obtenerNavegacion() {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (usuario.rol === 'Coordinador') {
      return { ruta: '/coordinador/dashboard', etiqueta: 'Dashboard Coordinador' };
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage', error);
  }

  return { ruta: '/agente/dashboard', etiqueta: 'Dashboard Agente' };
}

function agruparPorCategoria(articulos) {
  return articulos.reduce((grupos, articulo) => {
    const categoria = articulo.categoria?.trim() || 'General';
    if (!grupos[categoria]) grupos[categoria] = [];
    grupos[categoria].push(articulo);
    return grupos;
  }, {});
}

function vistasDe(articulo) {
  return articulo.vistas ?? articulo.views ?? articulo.total_vistas ?? articulo.visitas ?? 0;
}

export default function GestionConocimiento() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formContenido, setFormContenido] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [dropdownFormatoAbierto, setDropdownFormatoAbierto] = useState(false);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState('Texto normal');
  const editorRef = useRef(null);
  const contenidoInicialRef = useRef('');
  const navigate = useNavigate();
  const navegacion = obtenerNavegacion();

  useEffect(() => {
    fetchArticulos();
  }, []);

  useEffect(() => {
    if (modalAbierto && editorRef.current) {
      editorRef.current.innerHTML = contenidoInicialRef.current;
    }
  }, [modalAbierto, editingId]);

  useEffect(() => {
    if (!modalAbierto) return undefined;

    function cerrarConEscape(event) {
      if (event.key === 'Escape' && !guardando) setModalAbierto(false);
    }

    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [modalAbierto, guardando]);

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

  const categoriasExistentes = Array.from(
    new Set(articulos.map(articulo => articulo.categoria).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'es'));

  function abrirModalCrear() {
    contenidoInicialRef.current = '';
    setEditingId(null);
    setFormTitulo('');
    setFormCategoria('');
    setFormContenido('');
    setMensajeExito('');
    setError('');
    setDropdownFormatoAbierto(false);
    setFormatoSeleccionado('Texto normal');
    setModalAbierto(true);
  }

  function abrirModalEditar(articulo) {
    contenidoInicialRef.current = articulo.contenidoMarkdown || articulo.contenido || '';
    setEditingId(articulo.idArticulo);
    setFormTitulo(articulo.titulo);
    setFormCategoria(articulo.categoria || '');
    setFormContenido(contenidoInicialRef.current);
    setMensajeExito('');
    setError('');
    setDropdownFormatoAbierto(false);
    setFormatoSeleccionado('Texto normal');
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (!guardando) setModalAbierto(false);
  }

  function handleEditorCommand(command) {
    document.execCommand(command, false, null);
    if (editorRef.current) {
      setFormContenido(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  }

  function handleFormatBlock(tagName, etiqueta) {
    document.execCommand('formatBlock', false, `<${tagName}>`);
    if (editorRef.current) {
      setFormContenido(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
    setFormatoSeleccionado(etiqueta);
    setDropdownFormatoAbierto(false);
  }

  function handleEditorInput() {
    if (editorRef.current) setFormContenido(editorRef.current.innerHTML);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!formTitulo.trim()) return setError('El título es requerido.');
    if (!formCategoria.trim()) return setError('La categoría es requerida.');

    const contenidoLimpio = formContenido.replace(/<br>/g, '').replace(/&nbsp;/g, '').trim();
    if (!contenidoLimpio || formContenido === '<div><br></div>') {
      return setError('El contenido del artículo es requerido.');
    }

    setGuardando(true);
    try {
      const payload = {
        titulo: formTitulo,
        categoria: formCategoria,
        contenidoMarkdown: formContenido
      };

      if (editingId !== null) {
        await api.put(`/conocimiento/${editingId}`, payload);
        setMensajeExito('Artículo actualizado con éxito.');
      } else {
        await api.post('/conocimiento', payload);
        setMensajeExito('Artículo creado con éxito.');
      }

      setModalAbierto(false);
      await fetchArticulos();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar el artículo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id, titulo) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el artículo "${titulo}"?`)) return;

    setError('');
    try {
      await api.delete(`/conocimiento/${id}`);
      setMensajeExito('Artículo eliminado correctamente.');
      await fetchArticulos();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al eliminar el artículo.');
    }
  }

  function cambiarBusqueda(event) {
    setFiltroTabla(event.target.value);
    setPagina(1);
  }

  const termino = filtroTabla.trim().toLocaleLowerCase('es');
  const articulosFiltrados = articulos
    .filter(articulo => (
      articulo.titulo?.toLocaleLowerCase('es').includes(termino)
      || (articulo.categoria || '').toLocaleLowerCase('es').includes(termino)
      || String(articulo.idArticulo).includes(termino)
    ))
    .sort((a, b) => {
      const categoriaA = a.categoria?.trim() || 'General';
      const categoriaB = b.categoria?.trim() || 'General';
      return categoriaA.localeCompare(categoriaB, 'es') || a.titulo.localeCompare(b.titulo, 'es');
    });
  const totalPaginas = Math.max(1, Math.ceil(articulosFiltrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const articulosPaginados = articulosFiltrados.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE
  );
  const grupos = agruparPorCategoria(articulosPaginados);

  return (
    <div className="knowledge-page">
      <header className="knowledge-header">
        <button type="button" className="knowledge-back" onClick={() => navigate(navegacion.ruta)}>
          <span aria-hidden="true">←</span> {navegacion.etiqueta}
        </button>
        <div className="knowledge-heading">
          <span>Centro de soporte</span>
          <h1>Base de conocimiento</h1>
        </div>
        <button type="button" className="knowledge-new" onClick={abrirModalCrear}>
          <span aria-hidden="true">＋</span> Nuevo artículo
        </button>
      </header>

      <main id="contenido-principal" className="knowledge-main" aria-busy={loading}>
        <section className="knowledge-intro" aria-labelledby="knowledge-title">
          <div>
            <p className="knowledge-eyebrow">Gestión de contenido</p>
            <h2 id="knowledge-title">Artículos organizados por categoría</h2>
            <p>Encuentra, actualiza y administra las respuestas que utiliza el equipo de soporte.</p>
          </div>
          <div className="knowledge-total" aria-label={`${articulos.length} artículos totales`}>
            <strong>{articulos.length}</strong>
            <span>artículos totales</span>
          </div>
        </section>

        {mensajeExito && <div className="knowledge-feedback knowledge-feedback--success" role="status">{mensajeExito}</div>}
        {error && !modalAbierto && <div className="knowledge-feedback knowledge-feedback--error" role="alert">{error}</div>}

        <section className="knowledge-content" aria-label="Listado de artículos">
          <div className="knowledge-controls">
            <div className="knowledge-search">
              <label htmlFor="knowledge-search">Buscar artículos</label>
              <div className="knowledge-search-field">
                <span aria-hidden="true">⌕</span>
                <input
                  id="knowledge-search"
                  type="search"
                  placeholder="ID, título o categoría"
                  value={filtroTabla}
                  onChange={cambiarBusqueda}
                />
              </div>
            </div>
            <p className="knowledge-result-count" aria-live="polite">
              {articulosFiltrados.length} {articulosFiltrados.length === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>

          {loading ? (
            <div className="knowledge-state" role="status">Cargando artículos...</div>
          ) : articulosFiltrados.length === 0 ? (
            <div className="knowledge-state">
              <strong>No se encontraron artículos</strong>
              <span>Prueba con otro título, categoría o identificador.</span>
            </div>
          ) : (
            <>
              <div className="knowledge-table-region">
                <table className="knowledge-table">
                  <caption className="knowledge-sr-only">Artículos de la base de conocimiento agrupados por categoría</caption>
                  <thead>
                    <tr>
                      <th scope="col">Artículo</th>
                      <th scope="col">Vistas</th>
                      <th scope="col" className="knowledge-actions-heading">Acciones</th>
                    </tr>
                  </thead>
                  {Object.entries(grupos).map(([categoria, articulosGrupo]) => (
                    <tbody key={categoria}>
                      <tr className="knowledge-category-row">
                        <th colSpan="3" scope="rowgroup">
                          <span>{categoria}</span>
                          <small>{articulosGrupo.length} en esta página</small>
                        </th>
                      </tr>
                      {articulosGrupo.map(articulo => (
                        <tr key={articulo.idArticulo}>
                          <td>
                            <span className="knowledge-id">#{articulo.idArticulo}</span>
                            <strong className="knowledge-article-title">{articulo.titulo}</strong>
                          </td>
                          <td><span className="knowledge-views">{vistasDe(articulo)} vistas</span></td>
                          <td>
                            <div className="knowledge-actions">
                              <button type="button" className="knowledge-action knowledge-action--edit" onClick={() => abrirModalEditar(articulo)}>Editar</button>
                              <button type="button" className="knowledge-action knowledge-action--delete" onClick={() => handleEliminar(articulo.idArticulo, articulo.titulo)}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>

              <div className="knowledge-card-list">
                {Object.entries(grupos).map(([categoria, articulosGrupo], indiceGrupo) => (
                  <section key={categoria} className="knowledge-card-group" aria-labelledby={`knowledge-category-${indiceGrupo}`}>
                    <div className="knowledge-card-group-title">
                      <h3 id={`knowledge-category-${indiceGrupo}`}>{categoria}</h3>
                      <span>{articulosGrupo.length}</span>
                    </div>
                    {articulosGrupo.map(articulo => (
                      <article key={articulo.idArticulo} className="knowledge-card">
                        <div>
                          <span className="knowledge-id">#{articulo.idArticulo}</span>
                          <span className="knowledge-views">{vistasDe(articulo)} vistas</span>
                        </div>
                        <h4>{articulo.titulo}</h4>
                        <div className="knowledge-actions">
                          <button type="button" className="knowledge-action knowledge-action--edit" onClick={() => abrirModalEditar(articulo)}>Editar</button>
                          <button type="button" className="knowledge-action knowledge-action--delete" onClick={() => handleEliminar(articulo.idArticulo, articulo.titulo)}>Eliminar</button>
                        </div>
                      </article>
                    ))}
                  </section>
                ))}
              </div>
            </>
          )}

          {!loading && (
            <Pagination
              currentPage={paginaActual}
              totalItems={articulosFiltrados.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPagina}
              ariaLabel="Paginación de artículos de conocimiento"
            />
          )}
        </section>
      </main>

      {modalAbierto && (
        <div className="knowledge-modal-overlay" onMouseDown={event => event.target === event.currentTarget && cerrarModal()}>
          <section className="knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="knowledge-modal-title">
            <div className="knowledge-modal-header">
              <div>
                <span>{editingId !== null ? 'Edición' : 'Creación'}</span>
                <h2 id="knowledge-modal-title">{editingId !== null ? 'Editar artículo' : 'Nuevo artículo de soporte'}</h2>
              </div>
              <button type="button" className="knowledge-modal-close" onClick={cerrarModal} aria-label="Cerrar formulario">×</button>
            </div>

            <form onSubmit={handleSubmit} className="knowledge-form">
              <div className="knowledge-modal-body">
                {error && <div className="knowledge-feedback knowledge-feedback--error" role="alert">{error}</div>}

                <div className="knowledge-form-field">
                  <label htmlFor="article-title">Título del artículo <span aria-hidden="true">*</span></label>
                  <input
                    id="article-title"
                    type="text"
                    placeholder="Ej. Cómo restablecer mi contraseña institucional"
                    value={formTitulo}
                    onChange={event => setFormTitulo(event.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="knowledge-form-field">
                  <label htmlFor="article-category">Categoría <span aria-hidden="true">*</span></label>
                  <input
                    id="article-category"
                    type="text"
                    list="categorias-sugeridas"
                    placeholder="Selecciona o escribe una nueva"
                    value={formCategoria}
                    onChange={event => setFormCategoria(event.target.value)}
                    aria-describedby="category-help"
                    required
                  />
                  <datalist id="categorias-sugeridas">
                    {categoriasExistentes.map(categoria => <option key={categoria} value={categoria} />)}
                  </datalist>
                  <small id="category-help">Usa una categoría existente o crea una nueva para mantener el contenido organizado.</small>
                </div>

                <div className="knowledge-form-field">
                  <label id="article-content-label">Contenido del artículo <span aria-hidden="true">*</span></label>
                  <div className="knowledge-toolbar" role="toolbar" aria-label="Formato del contenido">
                    <button type="button" onMouseDown={event => { event.preventDefault(); handleEditorCommand('bold'); }} aria-label="Aplicar negrita"><strong>B</strong></button>
                    <button type="button" onMouseDown={event => { event.preventDefault(); handleEditorCommand('italic'); }} aria-label="Aplicar cursiva"><em>I</em></button>
                    <div className="knowledge-format">
                      <button
                        type="button"
                        className="knowledge-format-trigger"
                        aria-haspopup="menu"
                        aria-expanded={dropdownFormatoAbierto}
                        onMouseDown={event => { event.preventDefault(); setDropdownFormatoAbierto(abierto => !abierto); }}
                      >
                        {formatoSeleccionado} <span aria-hidden="true">▾</span>
                      </button>
                      {dropdownFormatoAbierto && (
                        <div className="knowledge-format-menu" role="menu">
                          <button type="button" role="menuitem" onMouseDown={event => { event.preventDefault(); handleFormatBlock('p', 'Texto normal'); }}>Texto normal</button>
                          <button type="button" role="menuitem" onMouseDown={event => { event.preventDefault(); handleFormatBlock('h1', 'Título (H1)'); }}>Título (H1)</button>
                          <button type="button" role="menuitem" onMouseDown={event => { event.preventDefault(); handleFormatBlock('h2', 'Subtítulo (H2)'); }}>Subtítulo (H2)</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    ref={editorRef}
                    className="knowledge-editor"
                    contentEditable
                    role="textbox"
                    aria-multiline="true"
                    aria-labelledby="article-content-label"
                    aria-describedby="content-help"
                    onInput={handleEditorInput}
                    suppressContentEditableWarning
                  />
                  <small id="content-help">Selecciona texto y usa la barra para aplicar formato.</small>
                </div>
              </div>

              <div className="knowledge-modal-footer">
                <button type="button" className="knowledge-cancel" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                <button type="submit" className="knowledge-submit" disabled={guardando}>
                  {guardando ? 'Guardando...' : editingId !== null ? 'Actualizar artículo' : 'Crear artículo'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
