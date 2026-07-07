import { useState, useEffect } from 'react'

// ─── Conteúdo dos guias por módulo ───────────────────────────
const GUIAS = {
  dashboard: {
    titulo:'🕊️ Pombal Hoje',
    passos:[
      { icon:'📊', titulo:'O teu painel diário', desc:'O Dashboard mostra o estado do pombal em tempo real — pombos aptos, próximas provas, alertas de saúde e tarefas do dia.' },
      { icon:'🏁', titulo:'Banners contextuais', desc:'Quando há uma prova hoje, encestamento amanhã ou pombos em prova, aparece automaticamente um banner com informação relevante.' },
      { icon:'⚡', titulo:'Acesso rápido', desc:'Usa os atalhos no fundo do dashboard para ir directamente aos módulos mais usados — Pombos, Provas, Saúde e Alimentação.' },
    ],
    dica:'O LoftSocial também envia mensagens personalizadas baseadas nos teus dados — eclosões previstas, próximas provas e pombos em forma.',
  },
  pombos: {
    titulo:'🐦 Pombos',
    passos:[
      { icon:'➕', titulo:'Adicionar pombos', desc:'Clica em "Novo Pombo" e preenche anilha, nome, sexo e especialidade. A foto é opcional mas melhora a identificação.' },
      { icon:'📊', titulo:'Percentil e forma', desc:'O percentil é calculado automaticamente com base nos resultados de prova. A forma é registada manualmente no Rastreio de Forma.' },
      { icon:'🔍', titulo:'Filtros e ordenação', desc:'Filtra por pombal, especialidade ou estado. Ordena por percentil, forma, nome ou km totais voados.' },
      { icon:'📋', titulo:'Detalhe do pombo', desc:'Clica num pombo para ver as 5 tabs: Info, Provas, Saúde, Família e Treinos. Aqui tens o historial completo.' },
    ],
    dica:'Pombos com 3+ provas e percentil abaixo de 25% aparecem automaticamente como "Candidatos a dispensa" nas Analíticas.',
  },
  provas: {
    titulo:'🏆 Provas',
    passos:[
      { icon:'📅', titulo:'Registar prova', desc:'Clica em "Nova Prova" e preenche nome, data, distância e local de solta. Podes registar resultados individuais de cada pombo.' },
      { icon:'📦', titulo:'Encestamento', desc:'Na véspera da prova, usa o fluxo de encestamento para seleccionar os pombos e registar a hora. O estado actualiza automaticamente.' },
      { icon:'🏁', titulo:'Registar chegadas', desc:'No dia da prova, marca as chegadas por ordem. O sistema calcula o percentil de cada pombo na prova.' },
      { icon:'📈', titulo:'Vista calendário', desc:'Alterna entre lista e calendário para ver a distribuição das provas ao longo da época.' },
    ],
    dica:'O percentil compara o teu pombo com todos os que participaram na prova. 90%+ significa que só 10% chegaram antes.',
  },
  saude: {
    titulo:'🏥 Saúde',
    passos:[
      { icon:'🐦', titulo:'Vista por pombo', desc:'A tab "Efectivo" mostra o estado de saúde de cada pombo com histórico inline e mini gráfico de peso.' },
      { icon:'⚡', titulo:'Estados rápidos', desc:'Na tab Registos, podes mudar o estado de um pombo directamente (Apto → Lesionado) sem abrir o formulário completo.' },
      { icon:'💉', titulo:'Vacinas e planos', desc:'Regista vacinas e activa os Planos de Vacinação recomendados. O sistema alerta quando há doses em atraso.' },
      { icon:'📖', titulo:'Enciclopédia', desc:'A tab Doenças tem fichas completas das doenças mais comuns — sintomas, tratamento e prevenção.' },
    ],
    dica:'Ao marcar um pombo como Lesionado ou Doente, ele é automaticamente removido da lista de disponíveis para encestamento.',
  },
  reproducao: {
    titulo:'🥚 Reprodução',
    passos:[
      { icon:'🏠', titulo:'Cacifos', desc:'Cada pombal tem uma grelha de cacifos. Associa pares a cacifos específicos para melhor organização.' },
      { icon:'📅', titulo:'Registar postura', desc:'Regista a data da postura e o sistema calcula automaticamente as datas previstas de eclosão e de autonomia dos borrachinhos.' },
      { icon:'🔔', titulo:'Alertas automáticos', desc:'Recebes alertas quando há eclosões previstas para os próximos dias — no Dashboard e nas mensagens LoftSocial.' },
      { icon:'🧬', titulo:'Seleccionador IA', desc:'No módulo Casais IA, selecciona pares do teu efectivo e a IA analisa consanguinidade e sugere os melhores cruzamentos.' },
    ],
    dica:'Os borrachinhos criados na Reprodução são automaticamente adicionados ao efectivo quando atingem a data de autonomia.',
  },
  alimentacao: {
    titulo:'🌾 Alimentação',
    passos:[
      { icon:'📋', titulo:'Planos de alimentação', desc:'Cria planos para cada fase (Pré-competitivo, Competição, Muda...) com rações manhã e tarde.' },
      { icon:'✅', titulo:'Marcar como feito', desc:'Marca as tarefas diárias como concluídas. A ração é automaticamente descontada do armazém.' },
      { icon:'🏪', titulo:'Armazém', desc:'Gere o stock de produtos. O sistema alerta quando o stock está baixo e deduz automaticamente ao marcar tarefas.' },
      { icon:'💊', titulo:'Tratamentos', desc:'Adiciona tratamentos preventivos ao plano semanal. Podes associar produtos do armazém com dosagem.' },
    ],
    dica:'Usa misturas como "50% Sport Excellent + 50% Gerry Plus" e o sistema calcula o abate proporcional de cada produto.',
  },
  financas: {
    titulo:'💰 Finanças',
    passos:[
      { icon:'📊', titulo:'Dashboard financeiro', desc:'Vê KPIs, gráfico de barras mensais, pizza por categoria, custo/km e projecção anual tudo numa vista.' },
      { icon:'➕', titulo:'Registar movimento', desc:'Adiciona receitas e despesas. Podes associar cada movimento a um pombo específico para calcular o ROI por animal.' },
      { icon:'🎯', titulo:'Orçamento mensal', desc:'Define limites por categoria. O semáforo 🟢🟡🔴 mostra se estás dentro do orçamento.' },
      { icon:'📈', titulo:'Análise ROI', desc:'A tab Análise mostra o retorno de cada pombo — receitas de leilão vs custos de saúde e alimentação.' },
    ],
    dica:'O custo por km voado é calculado automaticamente dividindo as despesas totais pelos km registados nas provas.',
  },
  analiticas: {
    titulo:'📊 Analíticas',
    passos:[
      { icon:'📋', titulo:'Resumo', desc:'A primeira tab consolida tudo: provas, vitórias, pódios, km totais, finanças e saúde numa só vista.' },
      { icon:'🗺️', titulo:'Distâncias', desc:'Vê em que distâncias o teu efectivo performa melhor. O scatter plot mostra distância vs percentil de cada prova.' },
      { icon:'🏛️', titulo:'Clube', desc:'Compara o teu desempenho com a média nacional — percentil, taxa de vitória, provas e efectivo.' },
      { icon:'📈', titulo:'Comparativo', desc:'Ranking de todos os pombos do efectivo com barras de percentil para identificar os melhores rapidamente.' },
    ],
    dica:'As Analíticas não precisam de configuração — alimentam-se automaticamente dos dados de Pombos, Provas e Finanças.',
  },
  leiloes: {
    titulo:'🔨 Leilões',
    passos:[
      { icon:'🐦', titulo:'Leiloar um pombo', desc:'Clica em "Leiloar" e selecciona um pombo do teu efectivo — os dados preenchem automaticamente (anilha, provas, percentil, foto).' },
      { icon:'🥚', titulo:'Leilão de Descendente', desc:'Leiloa uma ninhada antes de nascer. Selecciona pai e mãe — o percentil médio dos pais é calculado automaticamente.' },
      { icon:'⭐', titulo:'Favoritos e alertas', desc:'Marca leilões como favoritos para seguir. Cria alertas por especialidade e percentil mínimo para ser notificado de novos leilões.' },
      { icon:'🔨', titulo:'Licitar', desc:'Usa os botões +1/+5/+10/+25/+50/+100€ para fazer lances rapidamente. No leilão silencioso, os valores são ocultos.' },
    ],
    dica:'O Certificado de Autenticidade inclui os dados verificados do pombo na plataforma — percentil, anilha e linhagem.',
  },
  forma: {
    titulo:'💪 Rastreio de Forma',
    passos:[
      { icon:'📈', titulo:'O que é a forma', desc:'Indicador de 0-100 que reflecte a condição física do pombo. 80+ = pico competitivo. Regista semanalmente.' },
      { icon:'🐦', titulo:'Seleccionar pombo', desc:'Escolhe um pombo do efectivo e vê o gauge com a forma actual, tendência vs registo anterior e histórico.' },
      { icon:'✍️', titulo:'Registar', desc:'Usa o slider para definir a forma (0-100), adiciona o peso e observações. O gráfico de evolução actualiza automaticamente.' },
      { icon:'📊', titulo:'Vista geral', desc:'Sem pombo seleccionado, vês o ranking de forma de todo o efectivo activo — útil para decidir quem encestamento.' },
    ],
    dica:'Regista sempre a forma 2-3 dias antes de uma prova importante. Um pombo em 85+ está no seu pico — não percas a oportunidade.',
  },
  comunidade: {
    titulo:'🌐 LoftSocial',
    passos:[
      { icon:'📰', titulo:'Feed', desc:'Publica resultados, treinos e conquistas. Os teus seguidores vêem no feed. Usa #hashtags para chegar a mais pessoas.' },
      { icon:'🗺️', titulo:'Mapa', desc:'Vê a localização de outros pombais no mapa. Activa o teu em Perfil → Coordenadas GPS do pombal.' },
      { icon:'🎯', titulo:'Desafios', desc:'Completa desafios semanais (publicar, comentar, seguir) para ganhar pontos e subir no ranking da comunidade.' },
      { icon:'💬', titulo:'Fórum', desc:'Debate técnico por categorias — Alimentação, Saúde, Genética, Provas. Cria tópicos e responde à comunidade.' },
    ],
    dica:'As mensagens no topo do feed são personalizadas com base nos teus dados — próximas provas, eclosões e pombos em forma.',
  },
  // ─── Novos guias ─────────────────────────────────────────────
  epoca: {
    titulo:'📅 Época',
    passos:[
      { icon:'📋', titulo:'Resumo da época', desc:'Vê os resultados consolidados da época actual — provas, vitórias, pódios e pombos em destaque.' },
      { icon:'🏆', titulo:'Ranking', desc:'Ranking do efectivo por percentil médio. Identifica os melhores pombos da época.' },
      { icon:'🔒', titulo:'Fechar época', desc:'No final da época, fecha-a para arquivar os resultados e iniciar uma nova. Os dados ficam no histórico.' },
      { icon:'🧬', titulo:'Casais IA', desc:'Com base nos resultados, a IA sugere os melhores cruzamentos para a próxima época.' },
    ],
    dica:'Fecha a época antes de iniciar a próxima para manter o histórico organizado por ano.',
  },
  meteo: {
    titulo:'🌤️ Meteorologia',
    passos:[
      { icon:'📍', titulo:'Previsão local', desc:'Pesquisa qualquer localidade ou usa a localização do teu pombal para ver a previsão dos próximos 7 dias.' },
      { icon:'🕊️', titulo:'Condições de voo', desc:'Cada dia é classificado: Favorável, Aceitável com cautela ou Desfavorável para lançamento de pombos.' },
      { icon:'🗺️', titulo:'Rota da Prova', desc:'Analisa as condições meteorológicas ao longo da rota — do local de solta até ao teu pombal.' },
    ],
    dica:'Consulta a Meteorologia sempre na véspera do encestamento para decidir se as condições são favoráveis.',
  },
  treinos: {
    titulo:'🎯 Treinos',
    passos:[
      { icon:'➕', titulo:'Registar treino', desc:'Regista data, local, distância, velocidade e os pombos participantes. A forma actualiza automaticamente.' },
      { icon:'📊', titulo:'Velocidade média', desc:'O módulo calcula a velocidade média de cada treino e a evolução ao longo do tempo.' },
      { icon:'🐦', titulo:'Pombos participantes', desc:'Selecciona quais os pombos que participaram em cada treino para rastrear a sua progressão.' },
    ],
    dica:'Treinos regulares de curta distância melhoram a orientação. Regista sempre para acompanhar a evolução.',
  },
  calendario: {
    titulo:'📅 Calendário',
    passos:[
      { icon:'📋', titulo:'Eventos', desc:'Regista provas, treinos, tratamentos e eventos do clube num calendário unificado.' },
      { icon:'🔔', titulo:'Alertas', desc:'Define alertas para eventos importantes — encestamento, vacinas, tratamentos.' },
      { icon:'📥', titulo:'Importar', desc:'Importa o calendário da tua coletividade em CSV para ter todas as provas de uma vez.' },
    ],
    dica:'Mantém o calendário actualizado para que os alertas automáticos de tratamento funcionem correctamente.',
  },
  checklist: {
    titulo:'✅ Checklist',
    passos:[
      { icon:'➕', titulo:'Criar tarefa', desc:'Adiciona tarefas por categoria: Manutenção, Saúde, Pré-Prova, Alimentação, etc. Podes associar a um pombo específico.' },
      { icon:'✅', titulo:'Concluir', desc:'Marca tarefas como concluídas. As recorrentes repetem-se automaticamente.' },
      { icon:'🏁', titulo:'Pré-Prova', desc:'Usa a categoria Pré-Prova para criar checklists de preparação antes de cada competição.' },
    ],
    dica:'Cria uma checklist de pré-prova com todas as tarefas de preparação e reutiliza-a em cada competição.',
  },
  mensagens: {
    titulo:'💬 Mensagens',
    passos:[
      { icon:'💬', titulo:'Conversas', desc:'Vê todas as conversas activas. Toca numa para abrir e responder.' },
      { icon:'✏️', titulo:'Nova mensagem', desc:'Inicia uma conversa com qualquer columbófilo que sigas ou que participe nos leilões.' },
      { icon:'🔔', titulo:'Notificações', desc:'Recebes notificação quando tens mensagens não lidas. O badge aparece no menu.' },
    ],
    dica:'Usa as Mensagens para contactar vendedores do Marketplace e compradores dos teus Leilões.',
  },
  perfil: {
    titulo:'👤 Perfil',
    passos:[
      { icon:'📸', titulo:'Foto e dados', desc:'Actualiza a tua foto, nome e dados do pombal. São visíveis no teu perfil público.' },
      { icon:'🏠', titulo:'Pombal', desc:'Adiciona as coordenadas GPS do pombal para aparecer no mapa da LoftSocial.' },
      { icon:'⚙️', titulo:'Preferências', desc:'Configura o idioma, tema e notificações da app.' },
    ],
    dica:'Um perfil completo com foto aumenta a confiança dos compradores nos leilões.',
  },
  clubes_setup: {
    titulo:'🏛️ Configurar Clube',
    passos:[
      { icon:'🏛️', titulo:'Dados do clube', desc:'Preenche o nome, NIF, morada e contactos do clube columbófilo.' },
      { icon:'👥', titulo:'Adicionar sócios', desc:'Importa sócios via CSV ou adiciona manualmente com número de FCP e dados de contacto.' },
      { icon:'💰', titulo:'Quotas', desc:'Define o valor das quotas anuais e regista os pagamentos de cada sócio.' },
    ],
    dica:'O módulo de Clubes requer licença institucional. Contacta suporte@fly2win.pt para activar.',
  },
  casaisIA: {
    titulo:'🧬 Seleccionador de Casais IA',
    passos:[
      { icon:'⚙️', titulo:'Parâmetros', desc:'Define especialidade alvo, macho fixo, consanguinidade máxima e número de sugestões antes de calcular.' },
      { icon:'🧮', titulo:'Algoritmo', desc:'O sistema analisa todas as combinações possíveis do teu efectivo — percentil, consanguinidade, especialidade e historial de provas.' },
      { icon:'🥇', titulo:'Ranking de pares', desc:'Os melhores pares aparecem ordenados por score (0-100). Verde = Excelente, Ouro = Bom, Azul = Razoável.' },
      { icon:'🤖', titulo:'Análise IA', desc:'Clica em 🤖 num par para receber análise detalhada da IA — potencial da descendência, riscos e recomendação final.' },
    ],
    dica:'Filtra por consanguinidade máxima ≤ 10% para garantir diversidade genética e evitar penalizações no score.',
  },
  pedigree: {
    titulo:'🌳 Pedigree',
    passos:[
      { icon:'🔍', titulo:'Pesquisar pombo', desc:'Usa a barra de pesquisa para encontrar qualquer pombo por nome ou anilha. O pedigree carrega automaticamente.' },
      { icon:'🌳', titulo:'Árvore genealógica', desc:'Vê 3 gerações — pais, avós e bisavós. Toca nos bisavós para expandir/recolher em mobile.' },
      { icon:'🎨', titulo:'Temas de cor', desc:'Escolhe entre 4 temas (Ouro, Azul, Verde, Roxo) — a preferência fica guardada automaticamente.' },
      { icon:'📤', titulo:'Partilhar e exportar', desc:'Copia o link público do pedigree ou exporta em PDF para partilhar com compradores ou federações.' },
    ],
    dica:'O link público do pedigree não requer login — ideal para partilhar com potenciais compradores em leilões.',
  },
  ligas: {
    titulo:'🏆 Ligas',
    passos:[
      { icon:'🌍', titulo:'Ligas oficiais', desc:'As Ligas Fly2Win por país (PT Velocidade, PT Fundo...) são actualizadas automaticamente com os resultados das provas registadas.' },
      { icon:'🔒', titulo:'Ligas privadas', desc:'Cria uma liga privada com código de convite. Define o sistema de pontuação e os pombos participantes.' },
      { icon:'📊', titulo:'Sistemas de pontuação', desc:'5 sistemas disponíveis: Percentil Médio, ELO, Pontos F1, Acumulado e Melhor Resultado.' },
      { icon:'🏛️', titulo:'Liga de Clubes', desc:'Formato Liga, Champions (grupos + eliminatórias) ou Desafio entre coletividades registadas na plataforma.' },
    ],
    dica:'No sistema ELO, vencer pombos com rating superior dá mais pontos. Ideal para ligas com participantes de nível muito diferente.',
  },
  marketplace: {
    titulo:'🛒 Marketplace',
    passos:[
      { icon:'🐦', titulo:'Anunciar pombo', desc:'Publica pombos à venda com preço fixo. Os dados de percentil e anilha são pré-preenchidos do teu efectivo.' },
      { icon:'🔍', titulo:'Pesquisar', desc:'Filtra por especialidade, distância, percentil mínimo e preço máximo para encontrar o pombo certo.' },
      { icon:'💬', titulo:'Contactar vendedor', desc:'Clica em "Contactar" para abrir uma conversa directa com o vendedor via Mensagens.' },
      { icon:'⭐', titulo:'Favoritos', desc:'Guarda anúncios interessantes em Favoritos para comparar mais tarde.' },
    ],
    dica:'Anúncios com foto e percentil verificado têm 3× mais contactos. Completa sempre o perfil do pombo antes de publicar.',
  },
  clubes: {
    titulo:'🏛️ Clubes',
    passos:[
      { icon:'👥', titulo:'Membros', desc:'Gere sócios com número de FCP, estado (activo/inactivo) e quotas em dia. Importa via CSV para migrar de outro sistema.' },
      { icon:'💰', titulo:'Quotas e finanças', desc:'Regista pagamentos de quotas e movimentos financeiros. O dashboard mostra receitas, despesas e saldo actual.' },
      { icon:'📢', titulo:'Comunicados', desc:'Publica comunicados para todos os sócios. Ficam visíveis no painel de cada membro.' },
      { icon:'📅', titulo:'Reuniões', desc:'Agenda reuniões com data, hora e local. Os sócios recebem notificação automática.' },
    ],
    dica:'A licença de Clube dá acesso ao módulo de gestão completo. Os sócios individuais precisam de plano próprio para aceder à plataforma.',
  },
}

// ─── Componente de guia ───────────────────────────────────────
export function GuiaModulo({ modulo, onFechar }) {
  const guia = GUIAS[modulo]
  if (!guia) return null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(5,13,26,.9)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0B1830', border:'1px solid rgba(212,175,55,.2)', borderRadius:16, width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #1B2D52', position:'sticky', top:0, background:'#0B1830', zIndex:1 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:900, color:'#fff' }}>{guia.titulo}</div>
          <button onClick={onFechar} style={{ background:'none', border:'none', color:'#7A8699', cursor:'pointer', fontSize:20, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
            {guia.passos.map((p,i)=>(
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px', background:'#101F40', borderRadius:10 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:'rgba(212,175,55,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:3 }}>{p.titulo}</div>
                  <div style={{ fontSize:12, color:'#7A8699', lineHeight:1.6 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {guia.dica&&(
            <div style={{ background:'rgba(45,212,167,.07)', border:'1px solid rgba(45,212,167,.2)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#2DD4A7', marginBottom:4 }}>💡 Dica Pro</div>
              <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6 }}>{guia.dica}</div>
            </div>
          )}
          <button onClick={onFechar} className="btn btn-primary" style={{ width:'100%' }}>Percebido, vamos lá!</button>
        </div>
      </div>
    </div>
  )
}

// ─── Hook para gerir guias com "não mostrar mais" ─────────────
export function useGuia(modulo) {
  const key = `cl_guia_visto_${modulo}`
  const [mostrar, setMostrar] = useState(false)

  useEffect(()=>{
    try {
      const visto = localStorage.getItem(key)
      if (!visto) setMostrar(true)
    } catch(e) {}
  },[key])

  const fechar = (naoMostrarMais=false) => {
    if (naoMostrarMais) {
      try { localStorage.setItem(key,'1') } catch(e) {}
    }
    setMostrar(false)
  }

  const resetar = () => {
    try { localStorage.removeItem(key) } catch(e) {}
    setMostrar(true)
  }

  return { mostrar, fechar, resetar }
}

// ─── Botão de ajuda reutilizável ──────────────────────────────
export function BotaoGuia({ modulo }) {
  const [aberto, setAberto] = useState(false)
  const guia = GUIAS[modulo]
  if (!guia) return null
  return (
    <>
      <button onClick={()=>setAberto(true)} style={{ background:'none', border:'1px solid #1B2D52', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:12, color:'#7A8699', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
        ℹ️ Guia
      </button>
      {aberto&&<GuiaModulo modulo={modulo} onFechar={()=>setAberto(false)}/>}
    </>
  )
}

// ─── Modal de guia com opção "não mostrar mais" ───────────────
export function GuiaAuto({ modulo }) {
  const key = `cl_guia_visto_${modulo}`
  const [aberto, setAberto] = useState(false)
  const [naoMostrar, setNaoMostrar] = useState(false)
  const guia = GUIAS[modulo]

  useEffect(()=>{
    try {
      if (!localStorage.getItem(key)) setAberto(true)
    } catch(e) {}
  },[key])

  const fechar = () => {
    if (naoMostrar) {
      try { localStorage.setItem(key,'1') } catch(e) {}
    }
    setAberto(false)
  }

  if (!aberto||!guia) return null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(5,13,26,.9)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0B1830', border:'1px solid rgba(212,175,55,.2)', borderRadius:16, width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #1B2D52', position:'sticky', top:0, background:'#0B1830' }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:900, color:'#fff' }}>👋 Bem-vindo ao {guia.titulo}</div>
          <button onClick={fechar} style={{ background:'none', border:'none', color:'#7A8699', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>
        <div style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
            {guia.passos.map((p,i)=>(
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 12px', background:'#101F40', borderRadius:10 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:2 }}>{p.titulo}</div>
                  <div style={{ fontSize:11, color:'#7A8699', lineHeight:1.5 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {guia.dica&&(
            <div style={{ background:'rgba(45,212,167,.07)', border:'1px solid rgba(45,212,167,.2)', borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'#2DD4A7', lineHeight:1.6 }}>💡 {guia.dica}</div>
            </div>
          )}
          <div onClick={()=>setNaoMostrar(v=>!v)} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, cursor:'pointer' }}>
            <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${naoMostrar?'#2DD4A7':'#334155'}`, background:naoMostrar?'#2DD4A7':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#050D1A', flexShrink:0 }}>{naoMostrar&&'✓'}</div>
            <span style={{ fontSize:12, color:'#7A8699' }}>Não mostrar este guia novamente</span>
          </div>
          <button onClick={fechar} className="btn btn-primary" style={{ width:'100%' }}>Percebido, vamos lá!</button>
        </div>
      </div>
    </div>
  )
}

export default GuiaModulo

