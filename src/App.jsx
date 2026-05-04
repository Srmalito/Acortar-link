import { useState, useEffect, useCallback } from 'react'
import './App.css'

// ─── Utilities ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'linkshortener_links'

function generateCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function isValidUrl(str) {
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

function truncateUrl(url, max = 50) {
  return url.length > max ? url.slice(0, max) + '…' : url
}

const BASE = window.location.origin + '/#/'

// ─── Icons ───────────────────────────────────────────────────────────────────

const Icon = ({ name, size = 18 }) => {
  const icons = {
    link: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
    ),
    copy: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    trash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
      </svg>
    ),
    external: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    ),
    zap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    qr: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        <path d="M14 14h3v3h-3z"/><path d="M17 17h4"/><path d="M21 14v3"/>
      </svg>
    ),
    globe: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    bar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    arrow: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    ),
  }
  return icons[name] || null
}

// ─── QR Code (canvas-based, simple) ──────────────────────────────────────────

function SimpleQR({ value, size = 200 }) {
  // We'll use a public QR API for simplicity
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0d0d1f&color=a78bfa&format=svg`
  return (
    <div className="qr-container">
      <img src={url} alt="QR Code" width={size} height={size} style={{ borderRadius: '12px' }} />
    </div>
  )
}

// ─── Toast Notification ───────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`toast toast-${type}`}>
      <Icon name={type === 'success' ? 'check' : 'zap'} size={16} />
      <span>{message}</span>
    </div>
  )
}

// ─── Redirect handler ─────────────────────────────────────────────────────────

function useRedirectHandler(links) {
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.startsWith('#/')) {
      const code = hash.slice(2)
      const found = links.find(l => l.code === code)
      if (found) {
        window.location.replace(found.originalUrl)
      }
    }
  }, [links])
}

// ─── Link Card ────────────────────────────────────────────────────────────────

function LinkCard({ link, onCopy, onDelete, copiedCode }) {
  const [showQr, setShowQr] = useState(false)
  const shortUrl = BASE + link.code
  const isCopied = copiedCode === link.code

  return (
    <div className="link-card">
      <div className="link-card-header">
        <div className="link-favicon">
          <img
            src={`https://www.google.com/s2/favicons?sz=32&domain=${getDomain(link.originalUrl)}`}
            alt=""
            onError={e => { e.target.style.display='none' }}
          />
          <Icon name="globe" size={14} />
        </div>
        <div className="link-info">
          <span className="link-domain">{getDomain(link.originalUrl)}</span>
          <span className="link-date">{formatDate(link.createdAt)}</span>
        </div>
        <div className="link-clicks">
          <Icon name="bar" size={14} />
          <span>{link.clicks} clics</span>
        </div>
      </div>

      <div className="link-original" title={link.originalUrl}>
        <Icon name="link" size={13} />
        <span>{truncateUrl(link.originalUrl)}</span>
      </div>

      <div className="link-short-row">
        <a
          href={shortUrl}
          className="link-short-url"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            // increment click count
          }}
        >
          <Icon name="zap" size={14} />
          {shortUrl}
          <Icon name="external" size={12} />
        </a>

        <div className="link-actions">
          <button
            className={`btn-icon ${isCopied ? 'copied' : ''}`}
            onClick={() => onCopy(link)}
            title="Copiar enlace"
          >
            <Icon name={isCopied ? 'check' : 'copy'} size={15} />
          </button>
          <button
            className={`btn-icon ${showQr ? 'active' : ''}`}
            onClick={() => setShowQr(p => !p)}
            title="Ver QR"
          >
            <Icon name="qr" size={15} />
          </button>
          <button
            className="btn-icon danger"
            onClick={() => onDelete(link.code)}
            title="Eliminar"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>

      {link.label && (
        <div className="link-label">
          <span>{link.label}</span>
        </div>
      )}

      {showQr && (
        <div className="link-qr-panel">
          <SimpleQR value={shortUrl} size={160} />
          <p className="qr-hint">Escanea para acceder al enlace</p>
        </div>
      )}
    </div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ links }) {
  const totalClicks = links.reduce((s, l) => s + l.clicks, 0)
  const topLink = links.length ? links.reduce((a, b) => a.clicks > b.clicks ? a : b, links[0]) : null

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-value">{links.length}</span>
        <span className="stat-label">Enlaces</span>
      </div>
      <div className="stat-divider"/>
      <div className="stat-item">
        <span className="stat-value">{totalClicks}</span>
        <span className="stat-label">Clics totales</span>
      </div>
      <div className="stat-divider"/>
      <div className="stat-item">
        <span className="stat-value">{topLink ? topLink.clicks : 0}</span>
        <span className="stat-label">Mejor enlace</span>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [links, setLinks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch { return [] }
  })
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastCreated, setLastCreated] = useState(null)

  // Persist links
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  }, [links])

  // Handle redirect
  useRedirectHandler(links)

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }

  const handleShorten = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = url.trim()
    const hasProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    const finalUrl = hasProtocol ? trimmed : 'https://' + trimmed

    if (!finalUrl || !isValidUrl(finalUrl)) {
      setError('Por favor ingresa una URL válida (ej: https://ejemplo.com)')
      return
    }

    const codeToUse = customCode.trim() || generateCode()

    if (customCode.trim() && links.some(l => l.code === codeToUse)) {
      setError('Ese código personalizado ya existe. Elige otro.')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 400)) // simulated async

    const newLink = {
      code: codeToUse,
      originalUrl: finalUrl,
      label: label.trim(),
      clicks: 0,
      createdAt: new Date().toISOString(),
    }

    setLinks(prev => [newLink, ...prev])
    setLastCreated(newLink)
    setUrl('')
    setLabel('')
    setCustomCode('')
    setShowAdvanced(false)
    setLoading(false)
    showToast('¡Enlace acortado con éxito!')
  }

  const handleCopy = useCallback((link) => {
    const shortUrl = BASE + link.code
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopiedCode(link.code)
      showToast('Copiado al portapapeles')
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }, [])

  const handleDelete = useCallback((code) => {
    setLinks(prev => prev.filter(l => l.code !== code))
    if (lastCreated?.code === code) setLastCreated(null)
    showToast('Enlace eliminado', 'info')
  }, [lastCreated])

  const filteredLinks = links.filter(l =>
    !search ||
    l.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
    l.label.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app">
      {/* Background orbs */}
      <div className="bg-orb orb-1"/>
      <div className="bg-orb orb-2"/>
      <div className="bg-orb orb-3"/>

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">
              <Icon name="zap" size={20} />
            </div>
            <div>
              <span className="logo-title">LinkSnap</span>
              <span className="logo-sub">Acortador de enlaces</span>
            </div>
          </div>
          {links.length > 0 && <StatsBar links={links} />}
        </div>
      </header>

      <main className="main">
        {/* Hero section */}
        <section className="hero">
          <div className="hero-badge">
            <Icon name="zap" size={12} />
            <span>Acorta cualquier enlace al instante</span>
          </div>
          <h1 className="hero-title">
            Transforma tus<br />
            <span className="gradient-text">URLs largas</span><br />
            en links perfectos
          </h1>
          <p className="hero-sub">
            Comparte publicaciones, perfiles y páginas con enlaces cortos y elegantes.<br />
            Sin registro. Sin límites. Todo en tu navegador.
          </p>
        </section>

        {/* Shorten Form */}
        <section className="form-section">
          <form className="shorten-form" onSubmit={handleShorten}>
            <div className="form-main-row">
              <div className="input-wrap">
                <span className="input-icon"><Icon name="link" size={18} /></span>
                <input
                  id="url-input"
                  type="text"
                  className="url-input"
                  placeholder="Pega tu enlace aquí... (YouTube, Instagram, TikTok, etc.)"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  autoComplete="off"
                  spellCheck="false"
                />
                {url && (
                  <button type="button" className="input-clear" onClick={() => setUrl('')}>×</button>
                )}
              </div>
              <button
                id="shorten-btn"
                type="submit"
                className="btn-shorten"
                disabled={loading || !url}
              >
                {loading ? (
                  <span className="spinner"/>
                ) : (
                  <>
                    <Icon name="zap" size={16} />
                    <span>Acortar</span>
                    <Icon name="arrow" size={14} />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="form-error">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="form-advanced-toggle">
              <button
                type="button"
                className="btn-text"
                onClick={() => setShowAdvanced(p => !p)}
              >
                {showAdvanced ? '▾ Ocultar opciones' : '▸ Opciones avanzadas (etiqueta, código personalizado)'}
              </button>
            </div>

            {showAdvanced && (
              <div className="form-advanced">
                <div className="advanced-field">
                  <label htmlFor="label-input">Etiqueta (opcional)</label>
                  <input
                    id="label-input"
                    type="text"
                    placeholder="Ej: Post de Instagram, Video YouTube..."
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    maxLength={60}
                  />
                </div>
                <div className="advanced-field">
                  <label htmlFor="code-input">
                    Código personalizado
                    <span className="field-hint"> — {BASE}<strong>{customCode || 'abc123'}</strong></span>
                  </label>
                  <input
                    id="code-input"
                    type="text"
                    placeholder="mi-link"
                    value={customCode}
                    onChange={e => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 20))}
                  />
                </div>
              </div>
            )}
          </form>

          {/* Last created result */}
          {lastCreated && (
            <div className="result-card">
              <div className="result-badge">✅ ¡Listo!</div>
              <div className="result-content">
                <span className="result-label">Tu enlace corto:</span>
                <div className="result-url-row">
                  <a
                    href={BASE + lastCreated.code}
                    className="result-url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {BASE + lastCreated.code}
                  </a>
                  <button
                    className={`btn-copy-result ${copiedCode === lastCreated.code ? 'copied' : ''}`}
                    onClick={() => handleCopy(lastCreated)}
                    id="copy-result-btn"
                  >
                    <Icon name={copiedCode === lastCreated.code ? 'check' : 'copy'} size={15} />
                    {copiedCode === lastCreated.code ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <span className="result-original">↳ {truncateUrl(lastCreated.originalUrl, 60)}</span>
              </div>
            </div>
          )}
        </section>

        {/* Links history */}
        {links.length > 0 && (
          <section className="history-section">
            <div className="history-header">
              <h2 className="history-title">
                <Icon name="link" size={20} />
                Mis enlaces
                <span className="history-count">{links.length}</span>
              </h2>
              <div className="search-wrap">
                <Icon name="search" size={15} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar enlaces..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  id="search-input"
                />
              </div>
            </div>

            {filteredLinks.length === 0 ? (
              <div className="empty-search">
                <Icon name="search" size={32} />
                <p>No se encontraron enlaces para "<strong>{search}</strong>"</p>
              </div>
            ) : (
              <div className="links-grid">
                {filteredLinks.map(link => (
                  <LinkCard
                    key={link.code}
                    link={link}
                    onCopy={handleCopy}
                    onDelete={handleDelete}
                    copiedCode={copiedCode}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {links.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="link" size={40} /></div>
            <h3>Sin enlaces aún</h3>
            <p>Pega una URL arriba para crear tu primer enlace corto</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>LinkSnap · Los datos se guardan localmente en tu navegador</p>
      </footer>

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type || 'success'}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
