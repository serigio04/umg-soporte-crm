class ProblemDetailsError extends Error {
  constructor({ status, title, detail, type, code, instance }) {
    super(detail);
    this.status = status || 500;
    this.title = title || 'Internal Server Error';
    this.detail = detail || 'Ha ocurrido un error no controlado en el servidor.';
    this.type = type || 'about:blank';
    this.code = code || 'INTERNAL_ERROR';
    this.instance = instance || null;
    this.timestamp = new Date().toISOString();
  }

  toObject(req) {
    return {
      type: this.type !== 'about:blank' 
        ? `https://api-soporte.miumg.edu.gt/errors/${this.type}` 
        : 'about:blank',
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance: this.instance || (req ? req.originalUrl : null),
      code: this.code,
      timestamp: this.timestamp
    };
  }
}

module.exports = ProblemDetailsError;