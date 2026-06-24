// src/hooks/useIdioma.js
import { useState, useEffect, createContext, useContext } from 'react'

// Traduções completas — PT (base), EN, ES
export const TRADUCOES = {
  // ── Secções da sidebar ──
  principal:    { pt:'Principal',    br:'Principal',    en:'Main',         es:'Principal' },
  desporto:     { pt:'Desporto',     br:'Esporte',      en:'Sport',        es:'Deporte' },
  gestao:       { pt:'Gestão',       br:'Gestão',       en:'Management',   es:'Gestión' },
  analise:      { pt:'Análise',      br:'Análise',      en:'Analytics',    es:'Análisis' },
  social:       { pt:'Social',       br:'Social',       en:'Social',       es:'Social' },
  sistema:      { pt:'Sistema',      br:'Sistema',      en:'System',       es:'Sistema' },
  // ── Navegação ──
  dashboard:    { pt:'Pombal Hoje',  br:'Colombário Hoje', en:'Loft Today', es:'Palomar Hoy' },
  pombos:       { pt:'Pombos',       br:'Pombos Correio',  en:'Pigeons',   es:'Palomas' },
  provas:       { pt:'Provas',       br:'Corridas',        en:'Races',     es:'Carreras' },
  treinos:      { pt:'Treinos',      br:'Treinos',         en:'Training',  es:'Entrenamientos' },
  calendario:   { pt:'Calendário',   br:'Calendário',      en:'Calendar',  es:'Calendario' },
  saude:        { pt:'Saúde',        br:'Saúde',           en:'Health',    es:'Salud' },
  reproducao:   { pt:'Reprodução',   br:'Reprodução',      en:'Breeding',  es:'Cría' },
  casais:       { pt:'Casais IA',    br:'Casais IA',       en:'AI Pairs',  es:'Parejas IA' },
  alimentacao:  { pt:'Alimentação',  br:'Alimentação',     en:'Feeding',   es:'Alimentación' },
  tratamentos:  { pt:'Tratamentos',  br:'Tratamentos',     en:'Treatments',es:'Tratamientos' },
  financas:     { pt:'Finanças',     br:'Finanças',        en:'Finances',  es:'Finanzas' },
  relatorios:   { pt:'Relatórios',   br:'Relatórios',      en:'Reports',   es:'Informes' },
  analiticas:   { pt:'Analíticas',   br:'Analíticas',      en:'Analytics', es:'Analíticas' },
  rastreioForma:{ pt:'Rastreio Forma',br:'Rastreio Forma', en:'Form Track',es:'Seguimiento' },
  epoca:        { pt:'Época',        br:'Época',           en:'Season',    es:'Temporada' },
  meteorologia: { pt:'Meteorologia', br:'Meteorologia',    en:'Weather',   es:'Meteorología' },
  comunidade:   { pt:'Comunidade',   br:'Comunidade',      en:'Community', es:'Comunidad' },
  mensagens:    { pt:'Mensagens',    br:'Mensagens',       en:'Messages',  es:'Mensajes' },
  clubes:       { pt:'Clubes',       br:'Clubes',          en:'Clubs',     es:'Clubes' },
  leiloes:      { pt:'Leilões',      br:'Leilões',         en:'Auctions',  es:'Subastas' },
  marketplace:  { pt:'Marketplace',  br:'Marketplace',     en:'Marketplace',es:'Mercado' },
  ligas:        { pt:'Ligas',        br:'Ligas',           en:'Leagues',   es:'Ligas' },
  planos:       { pt:'Planos',       br:'Planos',          en:'Plans',     es:'Planes' },
  importar:     { pt:'Importar',     br:'Importar',        en:'Import',    es:'Importar' },
  exportar:     { pt:'Exportar',     br:'Exportar',        en:'Export',    es:'Exportar' },
  afiliados:    { pt:'Afiliados',    br:'Afiliados',       en:'Affiliates',es:'Afiliados' },
  perfil:       { pt:'Perfil',       br:'Perfil',          en:'Profile',   es:'Perfil' },
  // ── Terminologia columbófila ──
  pombo:        { pt:'Pombo',        br:'Pombo Correio',   en:'Pigeon',    es:'Paloma' },
  pombal:       { pt:'Pombal',       br:'Colombário',      en:'Loft',      es:'Palomar' },
  anilha:       { pt:'Anilha',       br:'Argola',          en:'Ring',      es:'Anilla' },
  efectivo:     { pt:'Efectivo',     br:'Plantel',         en:'Stock',     es:'Efectivo' },
  prova:        { pt:'Prova',        br:'Corrida',         en:'Race',      es:'Carrera' },
  percentil:    { pt:'Percentil',    br:'Percentil',       en:'Percentile',es:'Percentil' },
  velocidade:   { pt:'Velocidade',   br:'Velocidade',      en:'Speed',     es:'Velocidad' },
  fundo:        { pt:'Fundo',        br:'Fundo',           en:'Long dist.',es:'Fondo' },
  federacao:    { pt:'Federação (FPC)',br:'Fed. (FENAC)',   en:'Federation',es:'Federación' },
  borrachinho:  { pt:'Borrachinho',  br:'Pinto/Filhote',   en:'Squab',     es:'Pichón' },
  cacifo:       { pt:'Cacifo',       br:'Gaiola/Ninho',    en:'Box/Nest',  es:'Nidal' },
  columbofilo:  { pt:'Columbófilo',  br:'Colombófilo',     en:'Pigeon fancier',es:'Colombófilo' },
  // ── UI ──
  guardar:      { pt:'Guardar',      br:'Salvar',          en:'Save',      es:'Guardar' },
  cancelar:     { pt:'Cancelar',     br:'Cancelar',        en:'Cancel',    es:'Cancelar' },
  eliminar:     { pt:'Eliminar',     br:'Excluir',         en:'Delete',    es:'Eliminar' },
  editar:       { pt:'Editar',       br:'Editar',          en:'Edit',      es:'Editar' },
  novo:         { pt:'Novo',         br:'Novo',            en:'New',       es:'Nuevo' },
  ativo:        { pt:'Activo',       br:'Ativo',           en:'Active',    es:'Activo' },
  inativo:      { pt:'Inactivo',     br:'Inativo',         en:'Inactive',  es:'Inactivo' },
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
  return { idioma, t, isBR: idioma==='br', isEN: idioma==='en', isES: idioma==='es' }
}

export function useIdiomaState() {
  const [idioma, setIdioma] = useState(() => localStorage.getItem('cl_idioma') || 'pt')
  useEffect(() => { localStorage.setItem('cl_idioma', idioma) }, [idioma])
  return { idioma, setIdioma }
}
