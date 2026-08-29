import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-app-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  // Permitimos GET ou POST para facilitar a chamada do app
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // 1. Validar a Chave Secreta enviada pelo App no Header (mesma lógica do seu exemplo)
  const appToken = req.headers['x-app-token'];
  const tokenSecretoServidor = process.env.APP_SECRET_TOKEN;

  if (!appToken || appToken !== tokenSecretoServidor) {
    return res.status(403).json({ error: 'Acesso negado. Requisição não autorizada.' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado no servidor.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. (Opcional avançado) Buscar o script diretamente de uma tabela do Supabase, 
    // caso queira editar o código direto no banco sem precisar fazer deploy de código.
    // Exemplo: SELECT codigo_js FROM scripts_app WHERE nome = 'extrator_ofs' AND ativo = true
    const { data: configScript, error: errScript } = await supabase
      .from('scripts_app')
      .select('codigo_js')
      .eq('nome', 'extrator_ofs')
      .single();

    let codigoJsFinal = '';

    if (!errScript && configScript && configScript.codigo_js) {
      codigoJsFinal = configScript.codigo_js;
    } else {
      // Fallback padrão codificado caso a tabela ainda não exista no banco
      codigoJsFinal = `
        (function() {
            let atividades = [];
            let linhas = document.querySelectorAll('div.grid-row, tr, [role="button"]');
            
            if (linhas.length > 0) {
                linhas.forEach(linha => {
                    const spans = linha.querySelectorAll('span.grid-identifier, span, div');
                    let textos = [];
                    spans.forEach(span => {
                        let t = span.innerText ? span.innerText.trim() : '';
                        if (t && (t.length > 3 && t.length < 100) && !textos.includes(t)) {
                            if (!t.includes('Oracle') && !t.includes('Pool') && !t.includes('Fechada')) {
                                textos.push(t);
                            }
                        }
                    });
                    if (textos.length > 0) {
                        let linhaUnificada = textos.join(" - ");
                        if (!atividades.includes(linhaUnificada)) {
                            atividades.push(linhaUnificada);
                        }
                    }
                });
            }
            
            if (atividades.length === 0) {
                const elementosTexto = document.querySelectorAll('span, p, a');
                elementosTexto.forEach(el => {
                    let txt = el.innerText ? el.innerText.trim() : '';
                    if (txt.match(/\\d{10,}/)) {
                        atividades.push(txt);
                    }
                });
            }

            localStorage.setItem('atividades_ofs', JSON.stringify(atividades));
        })();
      `;
    }

    // 3. Retorna o script JSON para o aplicativo Flet consumir
    return res.status(200).json({
      sucesso: true,
      versao: "1.0.1",
      script: codigoJsFinal
    });

  } catch (error) {
    console.error('❌ Erro ao prover script dinâmico:', error);
    return res.status(500).json({ error: error.message });
  }
}
