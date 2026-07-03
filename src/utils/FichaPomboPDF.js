// src/utils/FichaPomboPDF.js
// Gera PDF tipo "cartão de atleta" para um pombo
// Uso: import { gerarFichaPombo } from '../utils/FichaPomboPDF'
//      await gerarFichaPombo(pombo, historicoProvas, pedigreeInfo)

import jsPDF from 'jspdf'

const S = (v) => {
  if (v === null || v === undefined) return ''
  try { return String(v) } catch { return '' }
}

const COR = {
  void:   [2, 5, 9],
  ocean:  [10, 26, 46],
  steel:  [17, 32, 54],
  gold:   [200, 168, 75],
  goldD:  [122, 96, 32],
  white:  [240, 237, 232],
  fog:    [136, 153, 170],
  ghost:  [68, 85, 102],
  teal:   [45, 212, 167],
  red:    [248, 113, 113],
}

export async function gerarFichaPombo(pombo, historicoProvas = [], pedigreeInfo = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  let y = 0

  // ── Fundo escuro ──────────────────────────────────────────────────────────
  doc.setFillColor(...COR.void)
  doc.rect(0, 0, W, H, 'F')

  // ── Barra dourada topo ────────────────────────────────────────────────────
  doc.setFillColor(...COR.gold)
  doc.rect(0, 0, W, 3, 'F')

  // ── Header ────────────────────────────────────────────────────────────────
  y = 12
  doc.setFillColor(...COR.ocean)
  doc.roundedRect(10, y, W - 20, 48, 3, 3, 'F')

  // foto placeholder ou foto real
  const fotoX = 16, fotoY = y + 5, fotoW = 34, fotoH = 38
  doc.setFillColor(...COR.steel)
  doc.roundedRect(fotoX, fotoY, fotoW, fotoH, 2, 2, 'F')

  if (pombo.foto_url) {
    try {
      const img = await loadImageAsBase64(pombo.foto_url)
      if (img) doc.addImage(img, 'JPEG', fotoX, fotoY, fotoW, fotoH, undefined, 'FAST')
    } catch (e) {}
  } else {
    // emoji placeholder
    doc.setFontSize(22)
    doc.setTextColor(...COR.fog)
    doc.text(S(pombo.emoji || '🐦'), fotoX + fotoW / 2, fotoY + fotoH / 2 + 4, { align: 'center' })
  }

  // nome + anilha
  const infoX = fotoX + fotoW + 8
  doc.setFontSize(18)
  doc.setTextColor(...COR.white)
  doc.setFont('helvetica', 'bold')
  doc.text(S(pombo.nome), infoX, y + 14)

  doc.setFontSize(11)
  doc.setTextColor(...COR.gold)
  doc.setFont('helvetica', 'normal')
  doc.text(S(pombo.anilha), infoX, y + 21)

  // sexo + cor + idade
  const anoNasc = (() => { const m = pombo.anilha?.match(/-(\d{2})-/); if (!m) return null; const a = parseInt(m[1]); return a > 50 ? 1900+a : 2000+a })()
  const idade = anoNasc ? new Date().getFullYear() - anoNasc : null
  const infoLinha = [pombo.sexo === 'M' ? '♂ Macho' : '♀ Fêmea', pombo.cor, idade ? `${idade} anos` : null, pombo.pombal].filter(Boolean).join('  ·  ')
  doc.setFontSize(9)
  doc.setTextColor(...COR.fog)
  doc.text(infoLinha, infoX, y + 28)

  // especialidades
  if ((pombo.esp || []).length > 0) {
    const ESP_LABEL = { velocidade:'⚡ Velocidade', meio_fundo:'🎯 Meio-Fundo', fundo:'🏔️ Fundo', grande_fundo:'🌍 Grande Fundo', 'meio-fundo':'🎯 Meio-Fundo', 'grande-fundo':'🌍 Grande Fundo' }
    doc.setFontSize(8)
    doc.setTextColor(...COR.teal)
    doc.text((pombo.esp || []).map(e => S(ESP_LABEL[e] || e)).join('   '), infoX, y + 34)
  }

  // estado badge
  const estadoCor = pombo.estado === 'ativo' ? COR.teal : pombo.estado === 'lesionado' ? COR.red : COR.fog
  doc.setFillColor(...estadoCor)
  doc.roundedRect(infoX, y + 37, 22, 5, 1, 1, 'F')
  doc.setFontSize(7)
  doc.setTextColor(...COR.void)
  doc.setFont('helvetica', 'bold')
  doc.text(S(pombo.estado || 'ativo').toUpperCase(), infoX + 11, y + 40.5, { align: 'center' })

  // criador
  if (pombo.criador) {
    doc.setFontSize(8)
    doc.setTextColor(...COR.fog)
    doc.setFont('helvetica', 'normal')
    doc.text(`Criador: ${S(pombo.criador)}`, W - 16, y + 14, { align: 'right' })
  }

  y += 66

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = [
    { v: S(pombo.provas ?? 0), l: 'Provas', cor: COR.gold },
    { v: S(pombo.percentil ?? 0) + '%', l: 'Percentil', cor: COR.teal },
    { v: S(pombo.forma ?? 50) + '%', l: 'Forma', cor: [76, 141, 255] },
    { v: historicoProvas.length > 0 ? S(historicoProvas.reduce((s, r) => s + (r.races?.dist || 0), 0)) + 'km' : '—', l: 'km Totais', cor: [168, 85, 247] },
  ]
  const kpiW = (W - 20) / kpis.length
  kpis.forEach((k, i) => {
    const kx = 10 + i * kpiW
    doc.setFillColor(...COR.ocean)
    doc.roundedRect(kx, y, kpiW - 2, 22, 2, 2, 'F')
    doc.setFontSize(14)
    doc.setTextColor(...k.cor)
    doc.setFont('helvetica', 'bold')
    doc.text(k.v, kx + kpiW / 2 - 1, y + 11, { align: 'center' })
    doc.setFontSize(7)
    doc.setTextColor(...COR.fog)
    doc.setFont('helvetica', 'normal')
    doc.text(k.l.toUpperCase(), kx + kpiW / 2 - 1, y + 17, { align: 'center' })
  })
  y += 28

  // ── Pedigree simplificado ─────────────────────────────────────────────────
  if (pedigreeInfo?.pai || pedigreeInfo?.mae || pombo.pai || pombo.mae) {
    doc.setFontSize(9)
    doc.setTextColor(...COR.gold)
    doc.setFont('helvetica', 'bold')
    doc.text('PEDIGREE', 10, y)
    y += 5

    const cols = [
      { label: '♂ Pai', data: pedigreeInfo?.pai, raw: pombo.pai },
      { label: '♀ Mãe', data: pedigreeInfo?.mae, raw: pombo.mae },
    ]
    cols.forEach((c, i) => {
      const cx = 10 + i * (W / 2 - 10)
      doc.setFillColor(...COR.ocean)
      doc.roundedRect(cx, y, W / 2 - 14, 18, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...COR.fog)
      doc.text(c.label, cx + 4, y + 5)
      doc.setFontSize(9)
      doc.setTextColor(...COR.white)
      doc.setFont('helvetica', 'bold')
      const nome = c.data?.nome || c.raw || '—'
      const anilha = c.data?.anilha || ''
      doc.text(S(nome), cx + 4, y + 11)
      if (anilha) {
        doc.setFontSize(7)
        doc.setTextColor(...COR.gold)
        doc.setFont('helvetica', 'normal')
        doc.text(S(anilha), cx + 4, y + 16)
      }
      if (c.data?.percentil > 0) {
        doc.setFontSize(10)
        doc.setTextColor(...COR.teal)
        doc.setFont('helvetica', 'bold')
        doc.text(S(c.data.percentil) + '%', cx + W / 2 - 18, y + 12, { align: 'right' })
      }
    })
    y += 24
  }

  // ── Historial de provas ───────────────────────────────────────────────────
  if (historicoProvas.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(...COR.gold)
    doc.setFont('helvetica', 'bold')
    doc.text('HISTORIAL DE PROVAS', 10, y)
    y += 5

    // cabeçalho
    doc.setFillColor(...COR.steel)
    doc.rect(10, y, W - 20, 6, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...COR.fog)
    doc.setFont('helvetica', 'bold')
    doc.text('PROVA', 14, y + 4)
    doc.text('DATA', 90, y + 4)
    doc.text('DIST', 120, y + 4)
    doc.text('POS.', 145, y + 4)
    doc.text('VEL.', 165, y + 4)
    doc.text('%', 188, y + 4)
    y += 7

    const provasParaMostrar = historicoProvas.slice(0, 10)
    provasParaMostrar.forEach((r, i) => {
      if (y > H - 30) return
      if (i % 2 === 0) {
        doc.setFillColor(...COR.ocean)
        doc.rect(10, y - 1, W - 20, 6, 'F')
      }
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COR.white)
      const nome = S(r.races?.nome || 'Prova').slice(0, 30)
      const data = r.races?.data_reg ? new Date(r.races.data_reg).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
      const dist = r.races?.dist ? S(r.races.dist) + 'km' : '—'
      const pos = r.posicao ? S(r.posicao) + 'º' : '—'
      const vel = r.velocidade ? S(r.velocidade) + 'km/h' : '—'
      const pct = r.posicao && r.races?.n_pombos ? S(Math.round((r.posicao / r.races.n_pombos) * 100)) + '%' : '—'

      doc.text(nome, 14, y + 4)
      doc.text(data, 90, y + 4)
      doc.text(dist, 120, y + 4)
      const posColor = r.posicao === 1 ? COR.gold : r.posicao <= 3 ? [180, 120, 30] : COR.white
      doc.setTextColor(...posColor)
      doc.text(pos, 145, y + 4)
      doc.setTextColor(...COR.teal)
      doc.text(vel, 165, y + 4)
      doc.setTextColor(...COR.fog)
      doc.text(pct, 188, y + 4)
      y += 6
    })
    y += 4
  }

  // ── Observações ───────────────────────────────────────────────────────────
  if (pombo.obs) {
    doc.setFillColor(...COR.ocean)
    doc.roundedRect(10, y, W - 20, 16, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...COR.fog)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVAÇÕES', 14, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COR.white)
    const obsLines = doc.splitTextToSize(S(pombo.obs), W - 28)
    doc.text(obsLines.slice(0, 2), 14, y + 10)
    y += 20
  }

  // ── Rodapé ────────────────────────────────────────────────────────────────
  doc.setFillColor(...COR.gold)
  doc.rect(0, H - 3, W, 3, 'F')
  doc.setFontSize(7)
  doc.setTextColor(...COR.ghost)
  doc.setFont('helvetica', 'normal')
  doc.text('Fly2Win · fly2win.pt · Fly to Win, Conquer the Skies', W / 2, H - 7, { align: 'center' })
  doc.text(`Emitido em ${new Date().toLocaleDateString('pt-PT')}`, W - 12, H - 7, { align: 'right' })

  // ── Guardar ───────────────────────────────────────────────────────────────
  const nomeSeguro = S(pombo.nome).replace(/[^a-zA-Z0-9_-]/g, '_') || 'pombo'
  doc.save(`Ficha_${nomeSeguro}_${S(pombo.anilha).replace(/[^a-zA-Z0-9]/g, '')}.pdf`)
}

// helper: carregar imagem como base64
async function loadImageAsBase64(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}
