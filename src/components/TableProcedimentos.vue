<template>
  <div class="container-procedimentos">
    <form class="form-procedimentos" @submit.prevent="adicionarProcedimento">
      <div class="inputs-row">
        <div class="input-box">
          <label>Nome do Procedimento</label>
          <input type="text" v-model.trim="nome" placeholder="Ex: Consulta médica" />
        </div>

        <div class="input-box">
          <label>Preço</label>
          <input type="text" v-model.trim="preco" placeholder="Ex: 150,00" />
        </div>
      </div>

      <button type="submit" class="btn-adicionar" :disabled="loading">
        {{ loading ? "Salvando..." : "Adicionar Procedimento" }}
      </button>

      <p v-if="erro" style="margin-top:10px; color:#b00020;">{{ erro }}</p>
      <p v-if="sucesso" style="margin-top:10px; color:#0a7a2f;">{{ sucesso }}</p>
    </form>

    <!-- PESQUISA -->
    <div class="table-header">
      <input
        type="text"
        v-model.trim="busca"
        placeholder="Pesquisar procedimento..."
        class="input-search"
      />
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 90px;">ID</th>
            <th>Procedimento</th>
            <th style="width: 140px;">Preço</th>
            <th style="width: 220px;">Ações</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="procedimentosFiltrados.length === 0">
            <td colspan="4" class="empty">
              {{ carregandoLista ? "Carregando..." : "Nenhum procedimento encontrado" }}
            </td>
          </tr>

          <tr v-for="p in procedimentosFiltrados" :key="p.id">
            <td class="mono">{{ p.id }}</td>

            <!-- Nome -->
            <td>
              <template v-if="editandoId === p.id">
                <input class="cell-input" type="text" v-model.trim="editNome" />
              </template>
              <template v-else>
                {{ p.nome }}
              </template>
            </td>

            <!-- Preço -->
            <td>
              <template v-if="editandoId === p.id">
                <input
                  class="cell-input"
                  type="text"
                  v-model.trim="editPreco"
                  placeholder="Ex: 150,00"
                />
              </template>
              <template v-else>
                {{ formatarMoeda(p.preco) }}
              </template>
            </td>

            <!-- Ações -->
            <td>
              <div class="actions">
                <template v-if="editandoId === p.id">
                  <button
                    type="button"
                    class="btn btn-save"
                    @click="salvarEdicao(p.id)"
                    :disabled="loading"
                  >
                    {{ loading ? "Salvando..." : "Salvar" }}
                  </button>
                  <button type="button" class="btn btn-cancel" @click="cancelarEdicao" :disabled="loading">
                    Cancelar
                  </button>
                </template>

                <template v-else>
                  <button type="button" class="btn btn-edit" @click="iniciarEdicao(p)" :disabled="loading">
                    Editar
                  </button>
                  <button type="button" class="btn btn-delete" @click="excluirProcedimento(p.id)" :disabled="loading">
                    Excluir
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import axios from "axios"
import { ref, computed, onMounted } from "vue"

// ====== API ======
const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
})

// ====== STATE ======
const nome = ref("")
const preco = ref("")
const busca = ref("")
const procedimentos = ref([])

const carregandoLista = ref(false)
const loading = ref(false)
const erro = ref("")
const sucesso = ref("")

function setErro(msg) {
  erro.value = msg
  sucesso.value = ""
}

function setSucesso(msg) {
  sucesso.value = msg
  erro.value = ""
  setTimeout(() => (sucesso.value = ""), 2000)
}

// ====== FILTRO ======
const procedimentosFiltrados = computed(() => {
  if (!busca.value) return procedimentos.value
  return procedimentos.value.filter((p) =>
    String(p.nome || "").toLowerCase().includes(busca.value.toLowerCase())
  )
})

// ====== HELPERS ======
function parsePreco(valor) {
  // "1.234,56" -> 1234.56
  const limpo = String(valor)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "")
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

function formatarMoeda(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return "R$ 0,00"
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// ====== CRUD ======
async function carregarProcedimentos() {
  try {
    carregandoLista.value = true
    const { data } = await api.get("/procedimentos")
    // esperado: array [{id, nome, preco}]
    procedimentos.value = Array.isArray(data) ? data : (data?.rows ?? [])
  } catch (e) {
    setErro(e?.response?.data?.error || "Falha ao carregar procedimentos.")
    console.error(e)
  } finally {
    carregandoLista.value = false
  }
}

async function adicionarProcedimento() {
  setErro("")
  if (!nome.value || !preco.value) return setErro("Preencha nome e preço.")

  const precoNumero = parsePreco(preco.value)
  if (precoNumero === null) return setErro("Preço inválido. Ex: 150,00")

  try {
    loading.value = true
    const payload = { nome: nome.value, preco: String(precoNumero).replace(".", ",") } 
    // ^ pode mandar como número também, mas assim fica compatível com seu backend que converte vírgula/ponto

    const { data } = await api.post("/procedimentos", payload)

    // Se o backend retornar o item criado, usa ele; senão recarrega lista
    if (data?.id) {
      procedimentos.value.unshift(data)
    } else {
      await carregarProcedimentos()
    }

    nome.value = ""
    preco.value = ""
    setSucesso("Procedimento cadastrado!")
  } catch (e) {
    setErro(e?.response?.data?.error || "Não foi possível cadastrar procedimento.")
    console.error(e)
  } finally {
    loading.value = false
  }
}

// edição
const editandoId = ref(null)
const editNome = ref("")
const editPreco = ref("")

function iniciarEdicao(p) {
  editandoId.value = p.id
  editNome.value = p.nome
  // mostra com vírgula
  editPreco.value = String(p.preco ?? "").replace(".", ",")
}

function cancelarEdicao() {
  editandoId.value = null
  editNome.value = ""
  editPreco.value = ""
}

async function salvarEdicao(id) {
  setErro("")
  if (!editNome.value || !editPreco.value) return setErro("Preencha nome e preço.")

  const precoNumero = parsePreco(editPreco.value)
  if (precoNumero === null) return setErro("Preço inválido. Ex: 150,00")

  try {
    loading.value = true
    const payload = { nome: editNome.value, preco: String(precoNumero).replace(".", ",") }

    await api.put(`/procedimentos/${id}`, payload)

    // Atualiza localmente para ficar rápido
    const idx = procedimentos.value.findIndex((x) => x.id === id)
    if (idx !== -1) {
      procedimentos.value[idx] = { ...procedimentos.value[idx], nome: editNome.value, preco: precoNumero }
    } else {
      await carregarProcedimentos()
    }

    cancelarEdicao()
    setSucesso("Procedimento atualizado!")
  } catch (e) {
    setErro(e?.response?.data?.error || "Não foi possível atualizar procedimento.")
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function excluirProcedimento(id) {
  setErro("")
  if (editandoId.value === id) cancelarEdicao()

  // opcional: confirmação simples
  if (!confirm("Deseja excluir este procedimento?")) return

  try {
    loading.value = true
    await api.delete(`/procedimentos/${id}`)

    // remove local
    procedimentos.value = procedimentos.value.filter((p) => p.id !== id)
    setSucesso("Procedimento excluído!")
  } catch (e) {
    setErro(e?.response?.data?.error || "Não foi possível excluir procedimento.")
    console.error(e)
  } finally {
    loading.value = false
  }
}

// ====== LIFECYCLE ======
onMounted(() => {
  carregarProcedimentos()
})
</script>


<style scoped>
.container-procedimentos {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #f6f6f6;
  border-radius: 20px;
}

.form-procedimentos {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.inputs-row {
  display: flex;
  gap: 20px;
}

.input-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-box label {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.input-box input {
  height: 44px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-box input:focus {
  outline: none;
  border-color: #1e72b7;
  box-shadow: 0 0 0 3px rgba(30, 114, 183, 0.15);
}

.btn-adicionar {
  align-self: center;
  height: 44px;
  padding: 0 32px;
  border-radius: 10px;
  border: none;
  background: #1e72b7;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn-adicionar:hover {
  background: #155a93;
}

.btn-adicionar:active {
  transform: scale(0.98);
}

/* HEADER DA TABELA (PESQUISA) */
.table-header {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.input-search {
  width: 320px;
  height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #fff;
}

.input-search:focus {
  outline: none;
  border-color: #1e72b7;
  box-shadow: 0 0 0 3px rgba(30, 114, 183, 0.15);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
}

thead {
  background: #1e72b7;
}

thead th {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 14px;
  text-align: left;
}

tbody td {
  padding: 14px;
  font-size: 14px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

tbody tr:hover {
  background: #f0f6fc;
}

.empty {
  text-align: center;
  color: #888;
  padding: 24px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  color: #555;
}

/* Inputs dentro da tabela */
.cell-input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
  box-sizing: border-box;
  background: #fff;
}

.cell-input:focus {
  outline: none;
  border-color: #1e72b7;
  box-shadow: 0 0 0 3px rgba(30, 114, 183, 0.12);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.05s, opacity 0.2s;
}

.btn:active {
  transform: scale(0.98);
}

.btn-edit {
  background: #fff;
  border-color: #1e72b7;
  color: #1e72b7;
}

.btn-delete {
  background: #fff;
  border-color: #d64545;
  color: #d64545;
}

.btn-save {
  background: #1e72b7;
  color: #fff;
}

.btn-cancel {
  background: #eee;
  color: #333;
}

/* Responsivo */
@media (max-width: 768px) {
  .inputs-row {
    flex-direction: column;
  }

  .btn-adicionar {
    width: 100%;
  }

  .table-header {
    justify-content: stretch;
  }

  .input-search {
    width: 100%;
  }
}
</style>
```
