import React, { useState } from 'react';

// Componente para os ícones flutuantes do fundo (para simplicidade, usando emojis)
const BackgroundDecorations = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
    <span className="absolute text-7xl top-20 left-1/4 animate-float-slow">🎲</span>
    <span className="absolute text-8xl bottom-40 right-1/4 animate-float-delayed">🔴</span>
    <span className="absolute text-6xl top-1/3 right-10 animate-float">🟢</span>
    <span className="absolute text-7xl bottom-20 left-10 animate-float-slow">🟡</span>
    <span className="absolute text-8xl top-10 right-1/3 animate-float-delayed">🔵</span>
    <span className="absolute text-5xl bottom-1/2 left-1/2 animate-float">🎲</span>
  </div>
);

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

    try {
      // Simulação de envio
      await new Promise((resolve) => setTimeout(resolve, 2000)); 
      setSubmitted(true);
    } catch (error) {
      alert('Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fundo com Gradiente Radial e Animações (Adicionar keyframes no tailwind.config ou style tag)
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-center items-center p-4 bg-[#0a0e17] overflow-hidden">
      {/* Efeito de brilho radial no centro */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(30,58,138,0.3)_0%,_rgba(10,14,23,1)_70%)]"></div>
      
      {/* Elementos decorativos flutuantes */}
      <BackgroundDecorations />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-5deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; animation-delay: 1s; }
      `}</style>

      {/* Container Principal com Borda Neon Gradiente */}
      <div className="relative z-10 max-w-4xl w-full p-1 rounded-3xl bg-gradient-to-r from-red-600 via-yellow-400 to-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
        <div className="bg-[#111625] rounded-[22px] p-8 md:p-10 shadow-inner">
          
          {/* Cabeçalho */}
          <div className="flex flex-col items-center mb-8 text-center">
            {/* Logo do Jogo (Simulado com texto e cor) */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">👑</span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                <span className="text-yellow-400">LUDO</span> <span className="text-red-500">THREE STARS</span>
              </h1>
            </div>
          </div>

          {submitted ? (
            /* Mensagem de Sucesso */
            <div className="bg-emerald-900/40 border-2 border-emerald-500 rounded-2xl p-8 text-center shadow-lg animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-emerald-200">Solicitação Enviada!</h2>
              <p className="text-slate-300 text-base mt-3 max-w-md mx-auto leading-relaxed">
                Um e-mail de confirmação foi enviado para <strong className="text-white bg-slate-800 px-2 py-0.5 rounded">{formData.email}</strong>. 
                Seus dados serão removidos permanentemente dentro de 30 dias após a confirmação.
              </p>
            </div>
          ) : (
            /* Formulário de Solicitação */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Barra de Progresso Simulada */}
              <div className="flex items-center gap-2 mb-8">
                <div className="h-2 flex-1 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                <div className="h-2 flex-1 bg-slate-700 rounded-full"></div>
                <div className="h-2 flex-1 bg-slate-700 rounded-full"></div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">Solicitar Exclusão de Dados</h2>
                <span className="text-3xl opacity-80">🗑️</span>
              </div>

              {/* Grid de Inputs (E-mail e ID) */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
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
                    className="w-full bg-[#1a2033] border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                  />
                </div>

                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Player ID (Opcional)
                  </label>
                  <input
                    type="text"
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    placeholder="Ex: 123456"
                    className="w-full bg-[#1a2033] border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Motivo (Opcional)
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows="4"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Conte-nos por que deseja sair..."
                  className="w-full bg-[#1a2033] border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition resize-none"
                />
              </div>

              {/* Caixa de Atenção Estilizada */}
              <div className="bg-yellow-950/50 border-2 border-yellow-600 rounded-xl p-5 flex gap-4 items-start shadow-lg">
                <span className="text-3xl mt-1">⚠️</span>
                <div>
                  <h4 className="font-bold text-yellow-200 text-lg">ATENÇÃO:</h4>
                  <p className="text-yellow-100/90 text-sm leading-relaxed">
                    A exclusão da conta é <strong className="text-white underline">irreversível</strong>. Todo o seu progresso, histórico de partidas, conquistas e moedas virtuais serão apagados permanentemente e não poderão ser recuperados.
                  </p>
                </div>
              </div>

              {/* Checkbox de Confirmação */}
              <div className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  id="confirmCheck"
                  name="confirmCheck"
                  required
                  checked={formData.confirmCheck}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded-md border-slate-600 bg-[#1a2033] text-red-600 focus:ring-red-500 focus:ring-offset-[#111625]"
                />
                <label htmlFor="confirmCheck" className="text-sm text-slate-200 leading-normal">
                  Estou ciente e confirmo que desejo excluir minha conta do <strong>Ludo Three Stars</strong> e todos os dados associados a ela.
                </label>
              </div>

              {/* Botão Estilizado (Gradiente e Sombra) */}
              <button
                type="submit"
                disabled={loading || !formData.confirmCheck}
                className="w-full mt-6 bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-700 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-4 px-6 rounded-xl transition-all duration-300 text-lg shadow-[0_5px_0_#b91c1c] hover:shadow-[0_3px_0_#b91c1c] active:shadow-none active:translate-y-[3px] tracking-tight"
              ) : (
                {loading ? 'Processando solicitação...' : 'Solicitar Exclusão de Dados'}
              </button>
            </form>
          )}

          {/* Rodapé */}
          <div className="mt-12 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
            Dúvidas? Entre em contato através do e-mail:{' '}
            <a href="mailto:contato.grouptarkhizstudio@gmail.com" className="text-yellow-400 underline hover:text-yellow-300 transition">
              contato.grouptarkhizstudio@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}