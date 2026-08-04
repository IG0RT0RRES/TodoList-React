import React, { useState } from 'react';

export default function BaixaFormsPagamento() {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [pixData, setPixData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGerarPix = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Requisição para a sua API / Serverless Function na Vercel
      const response = await fetch('/api/criar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp, email })
      });

      const data = await response.json();

      if (response.ok) {
        setPixData(data); // Contém o QR Code e o copia-e-cola retornado pelo Stripe
      } else {
        alert('Erro ao gerar Pix: ' + data.error);
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Baixa Forms Automação - Pagamento Pix</h2>
      
      {!pixData ? (
        <form onSubmit={handleGerarPix} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>Nome Completo:</label><br />
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label>WhatsApp (com DDD):</label><br />
            <input 
              type="text" 
              value={whatsapp} 
              onChange={(e) => setWhatsapp(e.target.value)} 
              placeholder="5521999999999" 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label>E-mail:</label><br />
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px', background: '#635BFF', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Gerando Pix...' : 'Gerar Pix de Pagamento'}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h3>Pix Gerado com Sucesso!</h3>
          <p>Escaneie o QR Code ou utilize o código abaixo no app do seu banco:</p>
          
          {/* Se o backend retornar a imagem do QR code */}
          {pixData.qr_code_url && (
            <img src={pixData.qr_code_url} alt="QR Code Pix" style={{ width: '200px', height: '200px' }} />
          )}

          <div style={{ margin: '20px 0' }}>
            <textarea 
              readOnly 
              value={pixData.pix_copia_e_cola} 
              rows={4} 
              style={{ width: '100%', padding: '8px' }}
            />
            <button 
              onClick={() => navigator.clipboard.writeText(pixData.pix_copia_e_cola)}
              style={{ marginTop: '10px', padding: '8px 15px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Copiar Código Pix
            </button>
          </div>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Assim que o pagamento for confirmado, a sua chave de acesso será enviada automaticamente para o seu WhatsApp!
          </p>
        </div>
      )}
    </div>
  );
}
