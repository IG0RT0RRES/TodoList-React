import React, { useState } from 'react';

export default function DataDeletionRequest() {
  const [formData, setFormData] = useState({
    email: '',
    userId: '',
    reason: '',
    confirmCheck: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.confirmCheck) return;

    setLoading(true);

    // Conecte com a sua API/Backend para registrar a solicitação
    try {
      // Exemplo de requisição:
      // await fetch('/api/delete-account-request', { method: 'POST', body: JSON.stringify(formData) });
      
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulação de envio
      setSubmitted(true);
    } catch (error) {
      alert('Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-xl w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 md:p-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <span className="text-2xl font-black text-yellow-300 tracking-wider">LUDO</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Ludo Three Stars</h1>
          <p className="text-slate-400 text-sm mt-1">Solicitação de Exclusão de Conta e Dados</p>
        </div>

        {submitted ? (
          /* Mensagem de Sucesso */
          <div className="bg-emerald-900/40 border border-emerald-500/50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-emerald-200">Solicitação Recebida!</h2>
            <p className="text-slate-300 text-sm mt-2">
              Enviamos um e-mail de confirmação para <strong className="text-white">{formData.email}</strong>. 
              Sua conta e os dados associados serão permanentemente removidos dentro do prazo de 30 dias.
            </p>
          </div>
        ) : (
          /* Formulário de Solicitação */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-200 text-xs leading-relaxed">
              <strong>Atenção:</strong> A exclusão de dados é irreversível. Seu progresso, conquistas e moedas virtuais no jogo serão apagados permanentemente.
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                E-mail cadastrado na conta *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label htmlFor="userId" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                ID do Jogador / Usuário (Opcional)
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                placeholder="Ex: #123456"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Motivo da solicitação (Opcional)
              </label>
              <textarea
                id="reason"
                name="reason"
                rows="3"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Diga-nos por que deseja excluir sua conta..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="confirmCheck"
                name="confirmCheck"
                required
                checked={formData.confirmCheck}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="confirmCheck" className="text-xs text-slate-300 leading-snug">
                Estou ciente de que a exclusão da minha conta do <strong>Ludo Three Stars</strong> resultará na perda definitiva de todo o meu progresso e dados armazenados.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.confirmCheck}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm shadow-md"
            >
              {loading ? 'Enviando solicitação...' : 'Solicitar Exclusão de Dados'}
            </button>
          </form>
        )}

        {/* Rodapé / Informações adicionais de suporte */}
        <div className="mt-8 pt-4 border-t border-slate-700 text-center text-xs text-slate-500">
          Dúvidas? Entre em contato com nosso suporte através do e-mail{' '}
          <a href="mailto:contato.grouptarkhizstudio@gmail.com" className="text-slate-400 underline hover:text-white">
            contato.grouptarkhizstudio@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}