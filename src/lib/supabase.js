import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://tgqnbheetpgnpjsjphoj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRncW5iaGVldHBnbnBqc2pwaG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTk0NDIsImV4cCI6MjA5MjAzNTQ0Mn0.32ZjOUB-bOAIgtwwpKDVRSJy1w4xlOR7IMb4bRTK3Uo',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

export const db = {
  async uid() {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id
  },

  async getPerfil() {
    const uid = await this.uid()
    if (!uid) return null
    const { data } = await supabase.from('perfis').select('*').eq('user_id', uid).single()
    return data
  },
  async savePerfil(p) {
    const uid = await this.uid()
    if (!uid) throw new Error('Sem auth')
    const { data, error } = await supabase.from('perfis').upsert(
      { ...p, user_id: uid, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ).select().single()
    if (error) throw error
    return data
  },

  async getPombos() {
    const { data, error } = await supabase.from('pigeons').select('*').order('nome')
    if (error) throw error
    return data || []
  },
  async createPombo(p) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('pigeons').insert({ ...p, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updatePombo(id, changes) {
    const { data, error } = await supabase.from('pigeons').update(changes).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deletePombo(id) {
    const { error } = await supabase.from('pigeons').delete().eq('id', id)
    if (error) throw error
  },

  async getPombais() {
    const { data, error } = await supabase.from('lofts').select('*').order('nome')
    if (error) throw error
    return data || []
  },
  async createPombal(p) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('lofts').insert({ ...p, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updatePombal(id, c) {
    const { data, error } = await supabase.from('lofts').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deletePombal(id) {
    const { error } = await supabase.from('lofts').delete().eq('id', id)
    if (error) throw error
  },

  async getProvas() {
    const { data, error } = await supabase.from('races').select('*').order('data_reg', { ascending: false })
    if (error) throw error
    return data || []
  },
  async createProva(p) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('races').insert({ ...p, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateProva(id, c) {
    const { data, error } = await supabase.from('races').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteProva(id) {
    const { error } = await supabase.from('races').delete().eq('id', id)
    if (error) throw error
  },

  async getResultados(raceId) {
    const { data, error } = await supabase.from('race_results').select('*, pigeons(nome,anilha,emoji,foto_url)').eq('race_id', raceId).order('posicao', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data || []
  },
  async createResultado(r) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('race_results').insert({ ...r, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateResultado(id, c) {
    const { data, error } = await supabase.from('race_results').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteResultado(id) {
    const { error } = await supabase.from('race_results').delete().eq('id', id)
    if (error) throw error
  },

  async getTreinos() {
    const { data, error } = await supabase.from('treinos').select('*').order('data', { ascending: false })
    if (error) throw error
    return data || []
  },
  async createTreino(t) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('treinos').insert({ ...t, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateTreino(id, c) {
    const { data, error } = await supabase.from('treinos').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteTreino(id) {
    const { error } = await supabase.from('treinos').delete().eq('id', id)
    if (error) throw error
  },

  async getSaude() {
    const { data, error } = await supabase.from('health')
      .select('*, pigeons(nome,emoji)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async createSaude(s) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('health').insert({ ...s, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateSaude(id, c) {
    const { data, error } = await supabase.from('health').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteSaude(id) {
    const { error } = await supabase.from('health').delete().eq('id', id)
    if (error) throw error
  },

  async getFinancas() {
    const { data, error } = await supabase.from('financas').select('*').order('data_reg', { ascending: false })
    if (error) throw error
    return data || []
  },
  async createFinanca(f) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('financas').insert({ ...f, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateFinanca(id, c) {
    const { data, error } = await supabase.from('financas').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteFinanca(id) {
    const { error } = await supabase.from('financas').delete().eq('id', id)
    if (error) throw error
  },

  async uploadFoto(userId, pigeonId, file) {
    const ext = file.name.split('.').pop()
    const path = `pombos/${userId}/${pigeonId}.${ext}`
    const { error } = await supabase.storage.from('fotos-pombos').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('fotos-pombos').getPublicUrl(path)
    return data.publicUrl
  },

  async uploadAnexoProva(userId, raceId, file) {
    const ext = file.name.split('.').pop()
    const path = `provas/${userId}/${raceId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('documentos-provas').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('documentos-provas').getPublicUrl(path)
    return { url: data.publicUrl, nome: file.name, tipo: file.type, path }
  },
  async deleteAnexoProva(path) {
    const { error } = await supabase.storage.from('documentos-provas').remove([path])
    if (error) throw error
  },

  async getAcasalamentos() {
    const { data, error } = await supabase.from('breeding').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async createAcasalamento(a) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('breeding').insert({ ...a, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateAcasalamento(id, c) {
    const { data, error } = await supabase.from('breeding').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteAcasalamento(id) {
    const { error } = await supabase.from('breeding').delete().eq('id', id)
    if (error) throw error
  },

  async getStock() {
    const { data, error } = await supabase.from('stock').select('*').order('nome')
    if (error) throw error
    return data || []
  },
  async createStockItem(s) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('stock').insert({ ...s, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateStockItem(id, c) {
    const { data, error } = await supabase.from('stock').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteStockItem(id) {
    const { error } = await supabase.from('stock').delete().eq('id', id)
    if (error) throw error
  },

  async getTarefas() {
    const { data, error } = await supabase.from('tarefas').select('*').order('data_prevista', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data || []
  },
  async createTarefa(t) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('tarefas').insert({ ...t, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateTarefa(id, c) {
    const { data, error } = await supabase.from('tarefas').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteTarefa(id) {
    const { error } = await supabase.from('tarefas').delete().eq('id', id)
    if (error) throw error
  },

  async getEventosCal() {
    const { data, error } = await supabase.from('eventos_cal').select('*').order('data_evento')
    if (error) { if (error.code === '42P01') return []; throw error }
    return data || []
  },
  async createEventoCal(e) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('eventos_cal').insert({ ...e, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async deleteEventoCal(id) {
    const { error } = await supabase.from('eventos_cal').delete().eq('id', id)
    if (error) throw error
  },

  async getEpocas() {
    const { data, error } = await supabase.from('epocas').select('*').order('ano', { ascending: false })
    if (error) { if (error.code === '42P01') return []; throw error }
    return data || []
  },
  async createEpoca(e) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('epocas').insert({ ...e, user_id: uid }).select().single()
    if (error) throw error
    return data
  },

  async getFeedPosts() {
    const { data, error } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(30)
    if (error) { if (error.code === '42P01') return []; throw error }
    return data || []
  },
  async createFeedPost(p) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('community_posts').insert({ ...p, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async deleteFeedPost(id) {
    const { error } = await supabase.from('community_posts').delete().eq('id', id)
    if (error) throw error
  },
  async getRankingComunidade() {
    const { data, error } = await supabase.from('community_ranking').select('*').order('pontos', { ascending: false }).limit(50)
    if (error) { if (error.code === '42P01') return []; throw error }
    return data || []
  },
  async upsertRankingComunidade(nome, pontos) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('community_ranking').upsert({ user_id: uid, nome, pontos, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single()
    if (error) { if (error.code === '42P01') return null; throw error }
    return data
  },

  async isAdmin(email) {
    const { data, error } = await supabase.from('admin_users').select('*').eq('email', email).maybeSingle()
    if (error) return false
    return !!data
  },
  async getLicencas() {
    const { data, error } = await supabase.from('licencas').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async updateLicenca(id, c) {
    const { data, error } = await supabase.from('licencas').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async getTreatmentPlans() {
    const { data, error } = await supabase.from('treatment_plans').select('*').order('nome')
    if (error) { if (error.code === '42P01') return []; throw error }
    return data || []
  },
  async createTreatmentPlan(p) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('treatment_plans').insert({ ...p, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateTreatmentPlan(id, c) {
    const { data, error } = await supabase.from('treatment_plans').update({ ...c, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteTreatmentPlan(id) {
    const { error } = await supabase.from('treatment_plans').delete().eq('id', id)
    if (error) throw error
  },

  async getTreatmentApplications() {
    const { data, error } = await supabase.from('treatment_applications').select('*').order('semana_inicio', { ascending: false })
    if (error) { if (error.code === '42P01') return []; throw error }
    return data || []
  },
  async createTreatmentApplication(a) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('treatment_applications').insert({ ...a, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateTreatmentApplication(id, c) {
    const { data, error } = await supabase.from('treatment_applications').update({ ...c, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteTreatmentApplication(id) {
    const { error } = await supabase.from('treatment_applications').delete().eq('id', id)
    if (error) throw error
  },

  async getTreatmentProducts() {
    const { data, error } = await supabase.from('treatment_products').select('*').order('nome')
    if (error) { if (error.code === '42P01') return []; throw error }
    return data || []
  },
  async createTreatmentProduct(p) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('treatment_products').insert({ ...p, user_id: uid }).select().single()
    if (error) throw error
    return data
  },
  async updateTreatmentProduct(id, c) {
    const { data, error } = await supabase.from('treatment_products').update(c).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteTreatmentProduct(id) {
    const { error } = await supabase.from('treatment_products').delete().eq('id', id)
    if (error) throw error
  },

  async getMinhasLigas() {
    const uid = await this.uid()
    const { data, error } = await supabase.from('league_members').select('*, leagues(*)').eq('user_id', uid)
    if (error) { if (error.code === '42P01') return []; throw error }
    return (data || []).map(m => ({ ...m.leagues, meu_role: m.role })).filter(Boolean)
  },
  async createLeague(l) {
    const uid = await this.uid()
    const invite_code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { data, error } = await supabase.from('leagues').insert({ ...l, creator_id: uid, invite_code }).select().single()
    if (error) throw error
    await supabase.from('league_members').insert({ league_id: data.id, user_id: uid, nome: l.nome_membro || 'Eu', role: 'admin' })
    return data
  },
  async entrarLigaPorCodigo(invite_code, nome) {
    const uid = await this.uid()
    const { data: liga, error: e1 } = await supabase.from('leagues').select('*').eq('invite_code', invite_code.toUpperCase()).maybeSingle()
    if (e1) throw e1
    if (!liga) throw new Error('Código de liga inválido')
    const { error: e2 } = await supabase.from('league_members').insert({ league_id: liga.id, user_id: uid, nome, role: 'member' })
    if (e2) { if (e2.code === '23505') throw new Error('Já é membro desta liga'); throw e2 }
    return liga
  },
  async getMembrosLiga(leagueId) {
    const { data, error } = await supabase.from('league_members').select('*').eq('league_id', leagueId)
    if (error) throw error
    return data || []
  },
  async getResultadosLiga(leagueId) {
    const { data, error } = await supabase.from('league_results').select('*, races(nome, data_reg, tipo)').eq('league_id', leagueId)
    if (error) { if (error.code === '42P01') return []; throw error }
    return data || []
  },
  async registarResultadoLiga(r) {
    const uid = await this.uid()
    const { data, error } = await supabase.from('league_results').upsert({ ...r, user_id: uid }, { onConflict: 'league_id,user_id,race_id' }).select().single()
    if (error) throw error
    return data
  },
  async deleteLeague(id) {
    const { error } = await supabase.from('leagues').delete().eq('id', id)
    if (error) throw error
  },
  async sairDeLiga(leagueId, userId) {
    const { error } = await supabase.from('league_members').delete().eq('league_id', leagueId).eq('user_id', userId)
    if (error) throw error
  },
}
