import React, { useState } from 'react';
import Banner from '../img/banner.png';

export default function Payments() {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [pixData, setPixData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const handleGerarPix = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/criar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp, email })
      });

      const data = await response.json();

      if (response.ok) {
        setPixData(data);
      } else {
        alert('Erro ao gerar Pix: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = () => {
    if (pixData?.pix_copia_e_cola) {
      navigator.clipboard.writeText(pixData.pix_copia_e_cola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Top Navbar */}
      <header style={styles.topNavbar}>
        <div style={styles.navContent}>
          <span style={styles.navLogo}>⚡ Baixa Forms</span>
          <span style={styles.navBadge}>Ambiente Seguro</span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          
          {/* Banner Ilustrativo do App */}
          <div style={styles.bannerContainer}>
            <img 
              src={Banner} 
              alt="Automação de Baixas Simples e Rápida" 
              style={styles.bannerImage}
            />
          </div>

          {/* Card de Checkout */}
          <div style={styles.card}>
            <div style={styles.header}>
              <h2 style={styles.title}>Checkout de Pagamento</h2>
              <p style={styles.subtitle}>Preencha os campos abaixo para gerar o seu Pix instantâneo.</p>
            </div>

            {/* Box de Alerta */}
            <div style={styles.alertBox}>
              <span style={styles.alertIcon}>⚠️</span>
              <p style={styles.alertText}>
                <strong>Atenção:</strong> Insira seus dados corretos. A sua <strong>chave de acesso 🔑</strong> será enviada diretamente para o seu <strong>WhatsApp</strong> após a confirmação do pagamento.
              </p>
            </div>

            {!pixData ? (
              <form onSubmit={handleGerarPix} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nome Completo:</label>
                  <input 
                    type="text" 
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)} 
                    placeholder="Seu nome completo"
                    required 
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>WhatsApp (com DDD):</label>
                  <input 
                    type="text" 
                    value={whatsapp} 
                    onChange={(e) => setWhatsapp(e.target.value)} 
                    placeholder="(+55)2199999-9999" 
                    required 
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>E-mail:</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="seu@email.com" 
                    required 
                    style={styles.input}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{
                    ...styles.button, 
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Gerando Pix...' : 'Gerar Pix de Pagamento'}
                </button>
              </form>
            ) : (
              <div style={styles.successContainer}>
                <h3 style={{ color: '#4ade80', marginBottom: '10px' }}>Pix Gerado com Sucesso!</h3>
                <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '20px' }}>
                  Escaneie o QR Code ou utilize o código Copia e Cola abaixo:
                </p>
                
                {pixData.qr_code_url && (
                  <div style={styles.qrBox}>
                    <img src={pixData.qr_code_url} alt="QR Code Pix" style={styles.qrImage} />
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Pix Copia e Cola:</label>
                  <textarea 
                    readOnly 
                    value={pixData.pix_copia_e_cola} 
                    rows={3} 
                    style={styles.textarea}
                  />
                </div>

                <button 
                  onClick={handleCopiar}
                  style={{
                    ...styles.button,
                    backgroundColor: copiado ? '#10b981' : '#2563eb',
                    marginTop: '15px'
                  }}
                >
                  {copiado ? '✓ Código Copiado!' : 'Copiar Código Pix'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#121212',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
  },
  topNavbar: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #2d2d2d',
    padding: '16px 24px',
    boxSizing: 'border-box',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLogo: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  navBadge: {
    backgroundColor: '#1e3a8a',
    color: '#93c5fd',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 16px',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    width: '100%',
    maxWidth: '480px',
  },
  bannerContainer: {
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #2d2d2d',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  bannerImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    width: '100%',
    padding: '28px',
    border: '1px solid #2d2d2d',
    color: '#ffffff',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '13px',
    color: '#9ca3af',
  },
  alertBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    border: '1px solid rgba(234, 179, 8, 0.3)',
    borderRadius: '8px',
    padding: '12px 14px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  alertIcon: {
    fontSize: '16px',
    lineHeight: '1.4',
  },
  alertText: {
    fontSize: '13px',
    color: '#fef08a',
    margin: 0,
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#e5e7eb',
  },
  input: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  textarea: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    padding: '10px',
    color: '#9ca3af',
    fontSize: '12px',
    resize: 'none',
    outline: 'none',
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  qrBox: {
    backgroundColor: '#ffffff',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  qrImage: {
    width: '160px',
    height: '160px',
    display: 'block',
  }
};
