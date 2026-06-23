import { useState, useEffect, createContext, useContext } from 'react'

// Terminologia PT/PT vs PT/BR
export const TERMOS = {
  pombo:        { pt: 'Pombo',        br: 'Pombo Correio' },
  pombos:       { pt: 'Pombos',       br: 'Pombos Correio' },
  pombal:       { pt: 'Pombal',       br: 'Colombário' },
  anilha:       { pt: 'Anilha',       br: 'Argola' },
  anilhar:      { pt: 'Anilhar',      br: 'Anilhar' },
  efectivo:     { pt: 'Efectivo',     br: 'Plantel' },
  prova:        { pt: 'Prova',        br: 'Corrida' },
  provas:       { pt: 'Provas',       br: 'Corridas' },
  columbofilo:  { pt: 'Columbófilo',  br: 'Colombófilo' },
  columbofilia: { pt: 'Columbofilia', br: 'Columbofilia' },
  velocidade:   { pt: 'Velocidade',   br: 'Velocidade' },
  fundo:        { pt: 'Fundo',        br: 'Fundo' },
  percentil:    { pt: 'Percentil',    br: 'Percentil' },
  federacao:    { pt: 'Federação (FPC)', br: 'Federação (FENAC/Estadual)' },
  borrachinho:  { pt: 'Borrachinho',  br: 'Pinto / Filhote' },
  cacifo:       { pt: 'Cacifo',       br: 'Gaiola / Ninho' },
  ninhada:      { pt: 'Ninhada',      br: 'Ninhada' },
}

export const IdiomaContext = createContext('pt')

export function useIdioma() {
  const idioma = useContext(IdiomaContext)
  const t = (chave) => TERMOS[chave]?.[idioma] || TERMOS[chave]?.pt || chave
  return { idioma, t, isBR: idioma === 'br' }
}

export function useIdiomaState() {
  const [idioma, setIdioma] = useState(() => localStorage.getItem('cl_idioma') || 'pt')
  const trocar = () => {
    const novo = idioma === 'pt' ? 'br' : 'pt'
    setIdioma(novo)
    localStorage.setItem('cl_idioma', novo)
  }
  return { idioma, trocar }
}
