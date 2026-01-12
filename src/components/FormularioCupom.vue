<template>
  <div class="container-formulario">
    <form class="form-cupom" @submit.prevent="gerarCupom">
      <h2 class="title">Gerar cupom de desconto</h2>
      <p class="subtitle">Preencha os dados para gerar o QRCode.</p>

      <div class="inputs-row">
        <div class="input-box">
          <label>Procedimento</label>
          <select v-model="procedimentoId" required>
            <option value="" disabled>Selecione um procedimento</option>
            <option v-for="p in procedimentos" :key="p.id" :value="p.id">
              {{ p.nome }} — {{ formatarMoeda(p.preco) }}
            </option>
          </select>
        </div>

        <div class="input-box">
          <label>Porcentagem de desconto (0% - 100%)</label>
          <input
            type="number"
            v-model.number="desconto"
            min="0"
            max="100"
            step="1"
            placeholder="Ex: 20"
            required
          />
        </div>
      </div>

      <div class="inputs-row">
        <div class="input-box">
          <label>Nome da recepcionista</label>
          <input
            type="text"
            v-model.trim="recepcionista"
            placeholder="Ex: Maria Silva"
            required
          />
        </div>

        <div class="input-box">
          <label>Nome do paciente</label>
          <input
            type="text"
            v-model.trim="paciente"
            placeholder="Ex: João Pereira"
            required
          />
        </div>
      </div>

      <div class="inputs-row">
        <div class="input-box full">
          <label>Email do paciente</label>
          <input
            type="email"
            v-model.trim="email"
            placeholder="Ex: joao@email.com"
            required
          />
          <small class="hint">O QRCode será exibido na tela após gerar.</small>
        </div>
      </div>

      <div class="actions-row">
        <button type="submit" class="btn-gerar" :disabled="loading">
          {{ loading ? "Gerando..." : "Gerar desconto" }}
        </button>

        <p v-if="erro" class="msg error">{{ erro }}</p>
        <p v-if="sucesso" class="msg success">{{ sucesso }}</p>
      </div>
    </form>

    <!-- RESULTADO -->
    <div v-if="cupomGerado" class="result-card">
      <div class="result-header">
        <h3 class="result-title">Cupom gerado com sucesso</h3>
        <p class="result-sub">
          ID: <span class="mono">{{ cupomGerado.id }}</span> •
          Expira em: <span class="mono">{{ formatarData(cupomGerado.expires_at) }}</span>
        </p>
      </div>

      <div class="qr-wrap">
        <img :src="cupomGerado.qrBase64" alt="QRCode do Cupom" />
      </div>

      <div class="result-actions">
        <button type="button" class="btn-secondary" @click="copiarToken">
          Copiar token
        </button>
        <button type="button" class="btn-secondary" @click="copiarId">
          Copiar ID
        </button>
        <button type="button" class="btn-secondary" @click="limparResultado">
          Limpar
        </button>
      </div>
    </div>

    <!-- LISTAGEM -->
    <div class="list-card">
      <div class="list-header">
        <div class="left">
          <h3 class="list-title">Cupons gerados</h3>
          <p class="list-sub">Lista completa dos cupons cadastrados no banco.</p>
        </div>

        <div class="right">
          <input
            class="input-search"
            type="text"
            v-model.trim="buscaCupom"
            placeholder="Buscar por paciente, recepcionista, procedimento, email..."
          />
          <button type="button" class="btn-secondary" @click="carregarCupons" :disabled="loadingCupons">
            {{ loadingCupons ? "Atualizando..." : "Atualizar lista" }}
          </button>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style="width: 90px;">ID</th>
              <th>Status</th>

              <!-- Dados do cupom -->
              <th>Paciente</th>
              <th>Email</th>
              <th>Recepcionista</th>
              <th>Desconto</th>
              <th>Expira em</th>
              <th>Criado em</th>

              <!-- Procedimento -->
              <th>Procedimento</th>
              <th>Preço</th>
              <th>Preço c/ desconto</th>

              <!-- Campos "grandes" -->
              <th>Token</th>
              <th>QRCode</th>
              <th style="width: 220px;">Ações</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="cuponsFiltrados.length === 0">
              <td colspan="14" class="empty">Nenhum cupom encontrado</td>
            </tr>

            <tr v-for="c in cuponsFiltrados" :key="c.id">
              <td class="mono">{{ c.id }}</td>

              <td>
                <span class="badge" :class="statusClass(c)">
                  {{ statusTexto(c) }}
                </span>
              </td>

              <td>{{ c.nome_paciente ?? c.paciente_nome ?? "-" }}</td>
              <td class="mono">{{ c.email_paciente ?? c.paciente_email ?? "-" }}</td>
              <td>{{ c.recepcionista ?? "-" }}</td>

              <td class="mono">{{ Number(c.desconto ?? 0) }}%</td>
              <td class="mono">{{ formatarData(c.expires_at) }}</td>
              <td class="mono">{{ formatarData(c.created_at) }}</td>

              <td>{{ c.procedimento?.nome ?? c.procedimento_nome ?? "-" }}</td>
              <td class="mono">{{ formatarMoeda(c.valor ?? c.procedimento?.preco ?? c.procedimento_preco) }}</td>
              <td class="mono">{{ formatarMoeda(c.valor_descontado ?? calcularDescontado(c)) }}</td>

              <!-- Token -->
              <td class="mono small">
                {{ encurtar(c.token) }}
              </td>

              <!-- QR -->
              <td class="small">
                <span v-if="c.qrcode_base64 || c.qrBase64">Disponível</span>
                <span v-else>-</span>
              </td>

              <td>
                <div class="actions">
                  <button type="button" class="btn btn-mini" @click="copiarValor(c.token, 'Token copiado!')" :disabled="!c.token">
                    Copiar token
                  </button>

<button type="button" class="btn btn-mini danger" @click="excluirCupom(c.id)">
  Excluir
</button>


                  <button
                    type="button"
                    class="btn btn-mini"
                    @click="abrirQr(c)"
                    :disabled="!(c.qrcode_base64 || c.qrBase64)"
                  >
                    Ver QR
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="erroCupons" class="msg error" style="margin-top: 10px">{{ erroCupons }}</p>
    </div>

    <!-- MODAL QR -->
    <div v-if="qrModalAberto" class="modal-backdrop" @click.self="fecharQr">
      <div class="modal">
        <div class="modal-header">
          <strong>QRCode do Cupom #{{ qrSelecionado?.id }}</strong>
          <button class="modal-close" @click="fecharQr">✕</button>
        </div>

        <div class="modal-body">
          <img :src="qrSelecionadoImg" alt="QRCode" />
          <div class="modal-actions">
            <button class="btn-secondary" @click="copiarValor(qrSelecionadoImg, 'Base64 do QR copiado!')">
              Copiar base64
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
})

/** ⚠️ IMPORTANTE: para celular, troque para seu IP */
const scanBaseUrl = "http://192.168.0.10:5000"

const procedimentos = ref([])
const procedimentoId = ref("")
const desconto = ref(0)
const recepcionista = ref("")
const paciente = ref("")
const email = ref("")

const loading = ref(false)
const erro = ref("")
const sucesso = ref("")

const cupomGerado = ref(null)

// LISTAGEM
const cupons = ref([])
const loadingCupons = ref(false)
const erroCupons = ref("")
const buscaCupom = ref("")

// MODAL QR
const qrModalAberto = ref(false)
const qrSelecionado = ref(null)

const qrSelecionadoImg = computed(() => {
  if (!qrSelecionado.value) return ""
  return qrSelecionado.value.qrcode_base64 || qrSelecionado.value.qrBase64 || ""
})

function formatarMoeda(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return "R$ 0,00"
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatarData(valor) {
  if (!valor) return "-"
  const v = String(valor).replace(" ", "T")
  const d = new Date(v)
  if (!Number.isFinite(d.getTime())) return String(valor)
  return d.toLocaleString("pt-BR")
}

function encurtar(v) {
  if (!v) return "-"
  const s = String(v)
  if (s.length <= 10) return s
  return `${s.slice(0, 6)}...${s.slice(-4)}`
}

function calcularDescontado(c) {
  const preco = Number(c.valor ?? c.procedimento?.preco ?? c.procedimento_preco)
  const desc = Number(c.desconto ?? 0)
  if (!Number.isFinite(preco) || !Number.isFinite(desc)) return 0
  return Number((preco * (1 - desc / 100)).toFixed(2))
}

function isExpirado(c) {
  if (!c?.expires_at) return false
  const v = String(c.expires_at).replace(" ", "T")
  const exp = new Date(v)
  if (!Number.isFinite(exp.getTime())) return false
  return new Date() > exp
}

function statusTexto(c) {
  return isExpirado(c) ? "EXPIRADO" : "ATIVO"
}

function statusClass(c) {
  return isExpirado(c) ? "badge-expirado" : "badge-ativo"
}

async function carregarProcedimentos() {
  try {
    const { data } = await api.get("/procedimentos")
    procedimentos.value = Array.isArray(data) ? data : (data?.rows ?? [])
  } catch (e) {
    console.error(e)
    erro.value = "Não foi possível carregar procedimentos."
  }
}

async function carregarCupons() {
  try {
    erroCupons.value = ""
    loadingCupons.value = true
    const { data } = await api.get("/cupons")

    // Esperado: array
    cupons.value = Array.isArray(data) ? data : (data?.rows ?? [])
  } catch (e) {
    console.error(e)
    erroCupons.value = "Não foi possível carregar cupons."
  } finally {
    loadingCupons.value = false
  }
}

const cuponsFiltrados = computed(() => {
  const q = buscaCupom.value?.toLowerCase().trim()
  if (!q) return cupons.value

  return cupons.value.filter((c) => {
    const paciente = (c.nome_paciente ?? c.paciente_nome ?? "").toLowerCase()
    const rec = (c.recepcionista ?? "").toLowerCase()
    const email = (c.email_paciente ?? c.paciente_email ?? "").toLowerCase()
    const proc = (c.procedimento?.nome ?? c.procedimento_nome ?? "").toLowerCase()
    const id = String(c.id ?? "")
    return (
      paciente.includes(q) ||
      rec.includes(q) ||
      email.includes(q) ||
      proc.includes(q) ||
      id.includes(q)
    )
  })
})

function validar() {
  erro.value = ""
  sucesso.value = ""

  if (!procedimentoId.value) return (erro.value = "Selecione um procedimento.")
  if (desconto.value < 0 || desconto.value > 100) return (erro.value = "A porcentagem deve estar entre 0 e 100.")
  if (!recepcionista.value) return (erro.value = "Informe o nome da recepcionista.")
  if (!paciente.value) return (erro.value = "Informe o nome do paciente.")
  if (!email.value) return (erro.value = "Informe o email do paciente.")
  return true
}

function limparForm() {
  procedimentoId.value = ""
  desconto.value = 0
  recepcionista.value = ""
  paciente.value = ""
  email.value = ""
}

function limparResultado() {
  cupomGerado.value = null
}

async function copiarValor(texto, msg) {
  if (!texto) return
  await navigator.clipboard.writeText(String(texto))
  sucesso.value = msg || "Copiado!"
  setTimeout(() => (sucesso.value = ""), 1500)
}

async function excluirCupom(id) {
  const ok = confirm(`Tem certeza que deseja excluir o cupom #${id}?`)
  if (!ok) return

  try {
    await api.delete(`/cupons/${id}`)
    sucesso.value = "Cupom excluído!"
    setTimeout(() => (sucesso.value = ""), 1500)

    // remove da lista sem precisar buscar tudo de novo
    cupons.value = cupons.value.filter((c) => c.id !== id)
  } catch (e) {
    console.error(e)
    erroCupons.value = e?.response?.data?.error || "Não foi possível excluir o cupom."
  }
}


async function copiarToken() {
  if (!cupomGerado.value?.token) return
  await copiarValor(cupomGerado.value.token, "Token copiado!")
}

async function copiarId() {
  if (!cupomGerado.value?.id) return
  await copiarValor(String(cupomGerado.value.id), "ID copiado!")
}

async function copiarUrlScan(c) {
  if (!c?.id || !c?.token) return
  const url = `${scanBaseUrl}/cupons/scan?id=${c.id}&token=${encodeURIComponent(c.token)}`
  await copiarValor(url, "URL scan copiada!")
}

function abrirQr(c) {
  qrSelecionado.value = c
  qrModalAberto.value = true
}

function fecharQr() {
  qrModalAberto.value = false
  qrSelecionado.value = null
}

async function gerarCupom() {
  if (!validar()) return

  try {
    loading.value = true
    limparResultado()

    const payload = {
      procedimentoId: Number(procedimentoId.value),
      desconto: Number(desconto.value),
      recepcionista: recepcionista.value,
      paciente: paciente.value,
      email: email.value,
    }

    const { data } = await api.post("/cupons", payload)

    cupomGerado.value = {
      id: data?.id ?? data?.insertId,
      token: data?.token,
      expires_at: data?.expires_at,
      qrBase64: data?.qrBase64,
      urlScan: data?.urlScan,
    }

    sucesso.value = "Cupom gerado com sucesso!"
    setTimeout(() => (sucesso.value = ""), 2500)

    limparForm()

    // ✅ atualiza a lista automaticamente
    await carregarCupons()
  } catch (e) {
    console.error(e)
    erro.value = e?.response?.data?.error || "Não foi possível gerar o cupom."
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await carregarProcedimentos()
  await carregarCupons()
})
</script>

<style scoped>
.container-formulario {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px;
}

.form-cupom {
  width: 100%;
  max-width: 1100px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

.title {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 700;
}

.subtitle {
  margin: 0 0 18px 0;
  font-size: 14px;
  opacity: 0.75;
}

.inputs-row {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.input-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 320px;
}

.input-box.full {
  flex: 1 1 100%;
}

label {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.9;
}

input,
select {
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 12px;
  outline: none;
  font-size: 14px;
  background: #fff;
}

input:focus,
select:focus {
  border-color: rgba(30, 114, 183, 0.65);
  box-shadow: 0 0 0 3px rgba(30, 114, 183, 0.12);
}

.hint {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.btn-gerar {
  height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  background: #1e72b7;
  color: #fff;
}

.btn-gerar:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.msg {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.msg.error {
  color: #b00020;
}

.msg.success {
  color: #0a7a2f;
}

/* RESULTADO */
.result-card {
  max-width: 1100px;
  margin-top: 14px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

.result-header {
  margin-bottom: 12px;
}

.result-title {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 800;
}

.result-sub {
  margin: 0;
  opacity: 0.75;
  font-size: 13px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.small {
  font-size: 12px;
  opacity: 0.85;
}

.danger {
  border-color: rgba(176, 0, 32, 0.25);
  color: #b00020;
}


.qr-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px;
  border: 1px dashed rgba(0, 0, 0, 0.18);
  border-radius: 12px;
}

.qr-wrap img {
  width: 260px;
  height: 260px;
  object-fit: contain;
}

.result-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.btn-secondary {
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  font-weight: 700;
  cursor: pointer;
}

/* LIST */
.list-card {
  width: 100%;
  max-width: 1100px;
  margin-top: 14px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.list-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.list-sub {
  margin: 6px 0 0 0;
  opacity: 0.75;
  font-size: 13px;
}

.input-search {
  height: 40px;
  min-width: 320px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 12px;
}

.table-wrapper {
  width: 100%;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

thead th {
  position: sticky;
  top: 0;
  background: #fafafa;
  z-index: 1;
  text-align: left;
  font-size: 12px;
  letter-spacing: 0.2px;
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

tbody td {
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 13px;
  vertical-align: top;
}

.empty {
  text-align: center;
  padding: 18px;
  opacity: 0.75;
}

.badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.badge-ativo {
  background: rgba(10, 122, 47, 0.12);
  color: #0a7a2f;
  border: 1px solid rgba(10, 122, 47, 0.22);
}

.badge-expirado {
  background: rgba(176, 0, 32, 0.10);
  color: #b00020;
  border: 1px solid rgba(176, 0, 32, 0.22);
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  height: 34px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  font-weight: 800;
  cursor: pointer;
  font-size: 12px;
}

.btn-mini {
  height: 32px;
  padding: 0 10px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 9999;
}

.modal {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 18px 55px rgba(0,0,0,.25);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.08);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0,0,0,.08);
}

.modal-close {
  border: 0;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 16px;
  display: grid;
  gap: 12px;
  justify-items: center;
}

.modal-body img {
  width: 320px;
  height: 320px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px dashed rgba(0,0,0,.18);
  padding: 10px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 720px) {
  .input-search {
    min-width: 100%;
  }
  table {
    min-width: 1000px;
  }
}
</style>
```
