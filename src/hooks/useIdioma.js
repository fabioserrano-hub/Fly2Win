// src/hooks/useIdioma.js
import { useState, useEffect, createContext, useContext } from 'react'

// ─── DICIONÁRIO COMPLETO ────────────────────────────────────────
// Abrange: sidebar, títulos, botões, labels, mensagens de UI
export const TRADUCOES = {
  // ── Secções sidebar ──
  principal:      { pt:'Principal',      br:'Principal',       en:'Main',            es:'Principal' },
  desporto:       { pt:'Desporto',       br:'Esporte',         en:'Sport',           es:'Deporte' },
  gestao:         { pt:'Gestão',         br:'Gestão',          en:'Management',      es:'Gestión' },
  analise:        { pt:'Análise',        br:'Análise',         en:'Analytics',       es:'Análisis' },
  social:         { pt:'Social',         br:'Social',          en:'Social',          es:'Social' },
  sistema:        { pt:'Sistema',        br:'Sistema',         en:'System',          es:'Sistema' },
  // ── Módulos ──
  dashboard:      { pt:'Pombal Hoje',    br:'Colombário Hoje', en:'Loft Today',      es:'Palomar Hoy' },
  pombos:         { pt:'Pombos',         br:'Pombos Correio',  en:'Pigeons',         es:'Palomas' },
  pombal:         { pt:'Pombais',        br:'Colombários',     en:'Lofts',           es:'Palomares' },
  provas:         { pt:'Provas',         br:'Corridas',        en:'Races',           es:'Carreras' },
  treinos:        { pt:'Treinos',        br:'Treinos',         en:'Training',        es:'Entrenamientos' },
  calendario:     { pt:'Calendário',     br:'Calendário',      en:'Calendar',        es:'Calendario' },
  checklist:      { pt:'Checklist',      br:'Checklist',       en:'Checklist',       es:'Lista de tareas' },
  saude:          { pt:'Saúde',          br:'Saúde',           en:'Health',          es:'Salud' },
  reproducao:     { pt:'Reprodução',     br:'Reprodução',      en:'Breeding',        es:'Cría' },
  pedigree:       { pt:'Pedigree',       br:'Pedigree',        en:'Pedigree',        es:'Pedigrí' },
  casais:         { pt:'Casais IA',      br:'Casais IA',       en:'AI Pairs',        es:'Parejas IA' },
  alimentacao:    { pt:'Alimentação',    br:'Alimentação',     en:'Feeding',         es:'Alimentación' },
  tratamentos:    { pt:'Tratamentos',    br:'Tratamentos',     en:'Treatments',      es:'Tratamientos' },
  financas:       { pt:'Finanças',       br:'Finanças',        en:'Finances',        es:'Finanzas' },
  relatorios:     { pt:'Relatórios',     br:'Relatórios',      en:'Reports',         es:'Informes' },
  analiticas:     { pt:'Analíticas',     br:'Analíticas',      en:'Analytics',       es:'Analíticas' },
  rastreioForma:  { pt:'Rastreio Forma', br:'Rastreio Forma',  en:'Form Tracking',   es:'Seguimiento' },
  epoca:          { pt:'Época',          br:'Época',           en:'Season',          es:'Temporada' },
  meteorologia:   { pt:'Meteorologia',   br:'Meteorologia',    en:'Weather',         es:'Meteorología' },
  comunidade:     { pt:'Comunidade',     br:'Comunidade',      en:'Community',       es:'Comunidad' },
  mensagens:      { pt:'Mensagens',      br:'Mensagens',       en:'Messages',        es:'Mensajes' },
  clubes:         { pt:'Clubes',         br:'Clubes',          en:'Clubs',           es:'Clubes' },
  leiloes:        { pt:'Leilões',        br:'Leilões',         en:'Auctions',        es:'Subastas' },
  marketplace:    { pt:'Marketplace',    br:'Marketplace',     en:'Marketplace',     es:'Mercado' },
  ligas:          { pt:'Ligas',          br:'Ligas',           en:'Leagues',         es:'Ligas' },
  planos:         { pt:'Planos',         br:'Planos',          en:'Plans',           es:'Planes' },
  importar:       { pt:'Importar',       br:'Importar',        en:'Import',          es:'Importar' },
  exportar:       { pt:'Exportar',       br:'Exportar',        en:'Export',          es:'Exportar' },
  afiliados:      { pt:'Afiliados',      br:'Afiliados',       en:'Affiliates',      es:'Afiliados' },
  perfil:         { pt:'Perfil',         br:'Perfil',          en:'Profile',         es:'Perfil' },
  // ── Terminologia columbófila ──
  pombo:          { pt:'Pombo',          br:'Pombo Correio',   en:'Pigeon',          es:'Paloma' },
  pombalSing:     { pt:'Pombal',         br:'Colombário',      en:'Loft',            es:'Palomar' },
  anilha:         { pt:'Anilha',         br:'Argola',          en:'Ring',            es:'Anilla' },
  efectivo:       { pt:'Efectivo',       br:'Plantel',         en:'Stock',           es:'Efectivo' },
  prova:          { pt:'Prova',          br:'Corrida',         en:'Race',            es:'Carrera' },
  percentil:      { pt:'Percentil',      br:'Percentil',       en:'Percentile',      es:'Percentil' },
  velocidade:     { pt:'Velocidade',     br:'Velocidade',      en:'Speed',           es:'Velocidad' },
  fundo:          { pt:'Fundo',          br:'Fundo',           en:'Long dist.',      es:'Fondo' },
  federacao:      { pt:'Federação (FPC)',br:'Fed. (FENAC)',     en:'Federation',      es:'Federación' },
  borrachinho:    { pt:'Borrachinho',    br:'Pinto/Filhote',   en:'Squab',           es:'Pichón' },
  cacifo:         { pt:'Cacifo',         br:'Gaiola/Ninho',    en:'Box/Nest',        es:'Nidal' },
  columbofilo:    { pt:'Columbófilo',    br:'Colombófilo',     en:'Pigeon fancier',  es:'Colombófilo' },
  linhagem:       { pt:'Linhagem',       br:'Linhagem',        en:'Bloodline',       es:'Línea genética' },
  ninhada:        { pt:'Ninhada',        br:'Ninhada',         en:'Clutch',          es:'Nidada' },
  especialidade:  { pt:'Especialidade',  br:'Especialidade',   en:'Specialty',       es:'Especialidad' },
  // ── UI — Botões e acções ──
  guardar:        { pt:'Guardar',        br:'Salvar',          en:'Save',            es:'Guardar' },
  cancelar:       { pt:'Cancelar',       br:'Cancelar',        en:'Cancel',          es:'Cancelar' },
  eliminar:       { pt:'Eliminar',       br:'Excluir',         en:'Delete',          es:'Eliminar' },
  editar:         { pt:'Editar',         br:'Editar',          en:'Edit',            es:'Editar' },
  novo:           { pt:'Novo',           br:'Novo',            en:'New',             es:'Nuevo' },
  nova:           { pt:'Nova',           br:'Nova',            en:'New',             es:'Nueva' },
  adicionar:      { pt:'Adicionar',      br:'Adicionar',       en:'Add',             es:'Añadir' },
  pesquisar:      { pt:'Pesquisar',      br:'Pesquisar',       en:'Search',          es:'Buscar' },
  filtrar:        { pt:'Filtrar',        br:'Filtrar',         en:'Filter',          es:'Filtrar' },
  carregar:       { pt:'Carregar',       br:'Carregar',        en:'Load',            es:'Cargar' },
  descarregar:    { pt:'Descarregar',    br:'Baixar',          en:'Download',        es:'Descargar' },
  importar2:      { pt:'Importar',       br:'Importar',        en:'Import',          es:'Importar' },
  exportar2:      { pt:'Exportar',       br:'Exportar',        en:'Export',          es:'Exportar' },
  confirmar:      { pt:'Confirmar',      br:'Confirmar',       en:'Confirm',         es:'Confirmar' },
  fechar:         { pt:'Fechar',         br:'Fechar',          en:'Close',           es:'Cerrar' },
  ver:            { pt:'Ver',            br:'Ver',             en:'View',            es:'Ver' },
  partilhar:      { pt:'Partilhar',      br:'Compartilhar',    en:'Share',           es:'Compartir' },
  // ── UI — Estados e labels ──
  ativo:          { pt:'Activo',         br:'Ativo',           en:'Active',          es:'Activo' },
  inativo:        { pt:'Inactivo',       br:'Inativo',         en:'Inactive',        es:'Inactivo' },
  pendente:       { pt:'Pendente',       br:'Pendente',        en:'Pending',         es:'Pendiente' },
  concluido:      { pt:'Concluído',      br:'Concluído',       en:'Completed',       es:'Completado' },
  masculino:      { pt:'Macho',          br:'Macho',           en:'Male',            es:'Macho' },
  feminino:       { pt:'Fêmea',          br:'Fêmea',           en:'Female',          es:'Hembra' },
  // ── Campos comuns ──
  nome:           { pt:'Nome',           br:'Nome',            en:'Name',            es:'Nombre' },
  data:           { pt:'Data',           br:'Data',            en:'Date',            es:'Fecha' },
  local:          { pt:'Local',          br:'Local',           en:'Location',        es:'Lugar' },
  distancia:      { pt:'Distância',      br:'Distância',       en:'Distance',        es:'Distancia' },
  obs:            { pt:'Observações',    br:'Observações',     en:'Notes',           es:'Observaciones' },
  cor:            { pt:'Cor',            br:'Cor',             en:'Colour',          es:'Color' },
  sexo:           { pt:'Sexo',           br:'Sexo',            en:'Sex',             es:'Sexo' },
  foto:           { pt:'Foto',           br:'Foto',            en:'Photo',           es:'Foto' },
  descricao:      { pt:'Descrição',      br:'Descrição',       en:'Description',     es:'Descripción' },
  // ── Mensagens comuns ──
  semDados:       { pt:'Sem dados',      br:'Sem dados',       en:'No data',         es:'Sin datos' },
  carregando:     { pt:'A carregar...',  br:'Carregando...',   en:'Loading...',      es:'Cargando...' },
  erro:           { pt:'Erro',           br:'Erro',            en:'Error',           es:'Error' },
  sucesso:        { pt:'Guardado!',      br:'Salvo!',          en:'Saved!',          es:'Guardado!' },
  sair:           { pt:'Sair',           br:'Sair',            en:'Sign out',        es:'Salir' },
}

export const IDIOMAS = [
  { code:'pt', label:'🇵🇹 PT', nome:'Português (PT)' },
  { code:'br', label:'🇧🇷 BR', nome:'Português (BR)' },
  { code:'en', label:'🇬🇧 EN', nome:'English' },
  { code:'es', label:'🇪🇸 ES', nome:'Español' },
]

export const IdiomaContext = createContext('pt')

export function useIdioma() {
  const idioma = useContext(IdiomaContext)
  const t = (chave) => TRADUCOES[chave]?.[idioma] || TRADUCOES[chave]?.pt || chave
  return { idioma, t, isBR: idioma==='br', isEN: idioma==='en', isES: idioma==='es', isPT: idioma==='pt' }
}

export function useIdiomaState() {
  const [idioma, setIdioma] = useState(() => {
    try { return localStorage.getItem('cl_idioma') || 'pt' } catch { return 'pt' }
  })
  const trocar = (novo) => {
    setIdioma(novo)
    try { localStorage.setItem('cl_idioma', novo) } catch {}
  }
  return { idioma, setIdioma: trocar }
}
