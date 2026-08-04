import React, { useState } from 'react';
import './Payments.css'; // Opcional, caso queira separar o CSS, mas vamos usar estilos inline/modernos por facilidade

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
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.badge}>Automação Segura</span>
          <h2 style={styles.title}>Baixa Forms Automação</h2>
          <p style={styles.subtitle}>Preencha seus dados para gerar o Pix e liberar o seu acesso instantaneamente.</p>
        </div>

        {!pixData ? (
          <form onSubmit={handleGerarPix} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome Completo</label>
              <input 
                type="text" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                placeholder="Ex: João da Silva"
                required 
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>WhatsApp (com DDD)</label>
              <input 
                type="text" 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)} 
                placeholder="Ex: 5521999999999" 
                required 
                style={styles.input}
              />
              <span style={styles.hint}>Digite apenas números com DDI e DDD</span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail</label>
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
              {loading ? 'Gerando Pagamento Pix...' : 'Gerar Pix de Pagamento'}
            </button>
          </form>
        ) : (
          <div style={styles.successContainer}>
            <div style={styles.successBadge}>Pix Gerado com Sucesso!</div>
            <p style={styles.instruction}>Escaneie o QR Code abaixo com o aplicativo do seu banco ou utilize o código Copia e Cola:</p>
            
            {pixData.qr_code_url && (
              <div style={styles.qrBox}>
                <img src={pixData.qr_code_url} alt="QR Code Pix" style={styles.qrImage} />
              </div>
            )}

            <div style={styles.copyArea}>
              <label style={styles.label}>Pix Copia e Cola:</label>
              <textarea 
                readOnly 
                value={pixData.pix_copia_e_cola} 
                rows={3} 
                style={styles.textarea}
              />
              <button 
                onClick={handleCopiar}
                style={{
                  ...styles.copyButton,
                  backgroundColor: copiado ? '#10b981' : '#2563eb'
                }}
              >
                {copiado ? '✓ Código Copiado!' : 'Copiar Código Pix'}
              </button>
            </div>

            <div style={styles.footerNote}>
              <span style={styles.pulseDot}></span>
              <span>Aguardando confirmação do pagamento. O acesso será enviado ao seu WhatsApp automaticamente.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos modernos em objetos para facilitar a aplicação direta sem arquivos extras
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
    width: '100%',
    maxWidth: '480px',
    padding: '32px',
    border: '1px solid #334155',
    color: '#f8fafc',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  badge: {
    backgroundColor: '#3b82f622',
    color: '#60a5fa',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '12px',
    marginBottom: '8px',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  input: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: '11px',
    color: '#64748b',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  successBadge: {
    backgroundColor: '#05966922',
    color: '#34d399',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  instruction: {
    fontSize: '14px',
    color: '#cbd5e1',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  qrBox: {
    backgroundColor: '#ffffff',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  qrImage: {
    width: '180px',
    height: '180px',
    display: 'block',
  },
  copyArea: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
    marginBottom: '20px',
  },
  textarea: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '10px',
    color: '#94a3b8',
    fontSize: '12px',
    resize: 'none',
    outline: 'none',
  },
  copyButton: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#33415555',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'left',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#f59e0b',
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.7)',
  }
};
