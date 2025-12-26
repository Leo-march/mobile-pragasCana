import { Injectable } from '@angular/core';
import { ApiService, TalhaoAPI } from './api.service';
import { firstValueFrom } from 'rxjs';

// Interfaces locais (mantidas para compatibilidade)
export interface Armadilha {
  id: string;
  nome: string;
  foto?: string;
  dataFoto?: Date;
  apiId?: number;
  observacoes?: string;
}

export interface Campo {
  id: string;
  nome: string;
  localizacao?: string;
  dataCriacao: Date;
  armadilhas: Armadilha[];
  // Campos da API
  apiId?: number;
  area?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private campos: Campo[] = [];
  private readonly STORAGE_KEY = 'campos_data';
  private readonly PENDING_KEY = 'pending_uploads';
  private pendingUploads: Array<{ campoApiId?: number | null; armadilhaLocalId: string; armadilhaApiId?: number | null; dataUrl: string; retries?: number }> = [];
  private sincronizando = false;

  constructor(private apiService: ApiService) {
    this.inicializar();
  }

  private async inicializar() {
    // Carrega dados locais primeiro
    this.carregarDados();
    
    // Tenta sincronizar com a API
    await this.sincronizarComAPI();

    // Carrega fila de uploads pendentes e inicia processamento
    this.carregarPendingUploads();
    setInterval(() => this.processPendingUploads(), 15000);
  }

  // Sincronização com API
  private async sincronizarComAPI() {
    if (this.sincronizando) return;
    
    try {
      this.sincronizando = true;
      console.log('🔄 Sincronizando com API...');
      
      const talhoesAPI = await firstValueFrom(this.apiService.listarTalhoes());
      
      // Alguns endpoints de listagem não retornam as armadilhas embutidas.
      // Para garantir que tenhamos o conjunto completo, tentamos buscar o
      // talhão detalhado (que inclui armadilhas) via `obterTalhao(id)`.
      const talhoesDetalhados = await Promise.all(
        talhoesAPI.map(async (t) => {
          try {
            const detalhado = await firstValueFrom(this.apiService.obterTalhao(t.id));
            return detalhado;
          } catch (_err) {
            // Se não conseguir obter o detalhe, retorna o item da listagem
            return t;
          }
        })
      );

      // Mescla dados da API com dados locais (usando os talhões detalhados quando disponíveis)
      talhoesDetalhados.forEach(talhaoAPI => {
        const campoLocal = this.campos.find(c => c.apiId === talhaoAPI.id);
        
        if (campoLocal) {
          // Atualiza campo existente
          campoLocal.nome = (talhaoAPI as any).nome;
          campoLocal.area = (talhaoAPI as any).area;
          campoLocal.status = (talhaoAPI as any).status;
          // Sincroniza armadilhas retornadas pela API (substitui localmente quando presentes)
          if (Array.isArray((talhaoAPI as any).armadilhas)) {
            campoLocal.armadilhas = (talhaoAPI as any).armadilhas.map((a: any) => ({
              id: String(a.id),
              nome: a.nome,
              foto: a.foto || undefined,
              dataFoto: a.dataFoto ? new Date(a.dataFoto) : undefined,
              observacoes: a.observacoes || undefined
            }));
          }
        } else {
          // Cria novo campo a partir da API
          const novoCampo: Campo = {
            id: this.gerarId(),
            apiId: (talhaoAPI as any).id,
            nome: (talhaoAPI as any).nome,
            area: (talhaoAPI as any).area,
            status: (talhaoAPI as any).status,
            dataCriacao: new Date(),
            armadilhas: (Array.isArray((talhaoAPI as any).armadilhas) ? (talhaoAPI as any).armadilhas : []).map((a: any) => ({
              id: String(a.id),
              nome: a.nome,
              foto: a.foto || undefined,
              dataFoto: a.dataFoto ? new Date(a.dataFoto) : undefined,
              observacoes: a.observacoes || undefined
            }))
          };
          this.campos.push(novoCampo);
        }
      });
      
      this.salvarDados();
      console.log('✅ Sincronização concluída');
    } catch (error) {
      console.warn('⚠️ Erro ao sincronizar com API (usando dados locais):', error);
    } finally {
      this.sincronizando = false;
    }
  }

  // Carregar dados do localStorage
  private carregarDados() {
    const dados = localStorage.getItem(this.STORAGE_KEY);
    if (dados) {
      this.campos = JSON.parse(dados);
      this.campos.forEach(campo => {
        campo.dataCriacao = new Date(campo.dataCriacao);
        campo.armadilhas.forEach(armadilha => {
          if (armadilha.dataFoto) {
            armadilha.dataFoto = new Date(armadilha.dataFoto);
          }
        });
      });
    }
  }

  // Salvar dados no localStorage
  private salvarDados() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.campos));
  }

  // ===== OPERAÇÕES COM CAMPOS =====

  getCampos(): Campo[] {
    return this.campos;
  }

  getCampo(id: string): Campo | undefined {
    return this.campos.find(c => c.id === id);
  }

  async criarCampo(nome: string, localizacao?: string): Promise<Campo> {
    const novoCampo: Campo = {
      id: this.gerarId(),
      nome,
      localizacao,
      dataCriacao: new Date(),
      armadilhas: []
    };
    
    this.campos.push(novoCampo);
    this.salvarDados();

    // Sincroniza com API
    try {
      const talhaoAPI = await firstValueFrom(
        this.apiService.criarTalhao({
          nome,
          status: 'ativo'
        })
      );
      
      // Atualiza com ID da API
      novoCampo.apiId = talhaoAPI.id;
      this.salvarDados();
      console.log('✅ Campo criado na API:', talhaoAPI);
    } catch (error) {
      console.warn('⚠️ Erro ao criar campo na API (salvo localmente):', error);
    }

    return novoCampo;
  }

  private carregarPendingUploads() {
    try {
      const raw = localStorage.getItem(this.PENDING_KEY);
      if (raw) this.pendingUploads = JSON.parse(raw);
    } catch (e) {
      this.pendingUploads = [];
    }
  }

  private salvarPendingUploads() {
    try {
      localStorage.setItem(this.PENDING_KEY, JSON.stringify(this.pendingUploads));
    } catch (e) {
      console.warn('Não foi possível salvar pending uploads', e);
    }
  }

  async atualizarCampo(id: string, dados: Partial<Campo>): Promise<boolean> {
    const index = this.campos.findIndex(c => c.id === id);
    if (index !== -1) {
      this.campos[index] = { ...this.campos[index], ...dados };
      this.salvarDados();

      // Sincroniza com API se tiver apiId
      const campo = this.campos[index];
      if (campo.apiId) {
        try {
          await firstValueFrom(
            this.apiService.atualizarTalhao(campo.apiId, {
              nome: campo.nome,
              area: campo.area,
              status: campo.status
            })
          );
          console.log('✅ Campo atualizado na API');
        } catch (error) {
          console.warn('⚠️ Erro ao atualizar campo na API:', error);
        }
      }

      return true;
    }
    return false;
  }

  async deletarCampo(id: string): Promise<boolean> {
    const index = this.campos.findIndex(c => c.id === id);
    if (index !== -1) {
      const campo = this.campos[index];
      
      // Deleta da API se tiver apiId
      if (campo.apiId) {
        try {
          await firstValueFrom(this.apiService.deletarTalhao(campo.apiId));
          console.log('✅ Campo deletado da API');
        } catch (error) {
          console.warn('⚠️ Erro ao deletar campo da API:', error);
        }
      }

      this.campos.splice(index, 1);
      this.salvarDados();
      return true;
    }
    return false;
  }

  // ===== OPERAÇÕES COM ARMADILHAS =====

  adicionarArmadilha(campoId: string, nome: string, observacoes?: string): Armadilha | null {
    const campo = this.getCampo(campoId);
    if (campo) {
      const novaArmadilha: Armadilha = {
        id: this.gerarId(),
        nome,
        observacoes
      };
      campo.armadilhas.push(novaArmadilha);
      this.salvarDados();
      
      // Atualiza contagem na API
      this.atualizarContagemArmadilhas(campo);
      // Tenta sincronizar a armadilha recém-criada com a API (não await para não bloquear)
      if (campo.apiId) {
        this.sincronizarArmadilhaParaApi(campo.id, novaArmadilha.id).catch(err => console.warn('Erro sync armadilha:', err));
      }
      
      return novaArmadilha;
    }
    return null;
  }

  // Tenta criar a armadilha no backend se o talhão já estiver sincronizado
  async sincronizarArmadilhaParaApi(campoId: string, armadilhaLocalId: string) {
    const campo = this.getCampo(campoId);
    if (!campo || !campo.apiId) return;
    const armIndex = campo.armadilhas.findIndex(a => a.id === armadilhaLocalId);
    if (armIndex === -1) return;
    const arm = campo.armadilhas[armIndex];
    // não recriar se já tiver apiId
    if ((arm as any).apiId) return;

    try {
      const resp = await firstValueFrom(this.apiService.criarArmadilha(campo.apiId, { nome: arm.nome, observacao: arm.observacoes }));
      // atualizar referência local com apiId
      this.atualizarArmadilha(campoId, arm.id, { apiId: (resp as any).id });
      console.log('Armadilha sincronizada com API:', resp);
    } catch (err) {
      console.warn('Erro ao sincronizar armadilha para API:', err);
    }
  }

  atualizarArmadilha(campoId: string, armadilhaId: string, dados: Partial<Armadilha>): boolean {
    const campo = this.getCampo(campoId);
    if (campo) {
      const index = campo.armadilhas.findIndex(a => a.id === armadilhaId);
      if (index !== -1) {
        campo.armadilhas[index] = { ...campo.armadilhas[index], ...dados };
        this.salvarDados();
        return true;
      }
    }
    return false;
  }

  adicionarFoto(campoId: string, armadilhaId: string, foto: string): boolean {
    const updated = this.atualizarArmadilha(campoId, armadilhaId, {
      foto,
      dataFoto: new Date()
    });

    const campo = this.getCampo(campoId);
    const arm = campo?.armadilhas.find(a => a.id === armadilhaId);

    // Se tivermos apiId tanto do talhão quanto da armadilha, envia imediatamente
    if (campo && campo.apiId && arm && (arm as any).apiId) {
      firstValueFrom(this.apiService.uploadArmadilhaFoto(campo.apiId, (arm as any).apiId, foto))
        .then(resp => {
          if (resp && resp.foto) {
            this.atualizarArmadilha(campoId, armadilhaId, {
              foto: resp.foto,
              dataFoto: resp.dataFoto ? new Date(resp.dataFoto) : new Date()
            });
          }
        })
        .catch(err => {
          console.warn('Erro ao enviar foto para a API, enfileirando:', err);
          this.enqueueFotoForUpload(campo?.apiId || null, armadilhaId, (arm as any).apiId || null, foto);
        });
    } else {
      // não temos apiId(s) necessários — enfileira para envio posterior
      this.enqueueFotoForUpload(campo?.apiId || null, armadilhaId, arm ? (arm as any).apiId || null : null, foto);
    }

    return updated;
  }

  private enqueueFotoForUpload(campoApiId: number | null | undefined, armadilhaLocalId: string, armadilhaApiId: number | null | undefined, dataUrl: string) {
    this.pendingUploads.push({ campoApiId: campoApiId ?? null, armadilhaLocalId, armadilhaApiId: armadilhaApiId ?? null, dataUrl, retries: 0 });
    this.salvarPendingUploads();
  }

  private async processPendingUploads() {
    if (this.pendingUploads.length === 0) return;

    const queue = [...this.pendingUploads];
    for (const item of queue) {
      try {
        // se não temos apiId da armadilha, tente sincronizar/criar
        if (!item.armadilhaApiId && item.campoApiId) {
          // localizar campo e armadilha local
          const campoLocal = this.campos.find(c => c.apiId === item.campoApiId);
          const armLocal = campoLocal?.armadilhas.find(a => a.id === item.armadilhaLocalId);
          if (armLocal && !(armLocal as any).apiId) {
            // criar armadilha no servidor
            const resp = await firstValueFrom(this.apiService.criarArmadilha(item.campoApiId, { nome: armLocal.nome, observacao: armLocal.observacoes }));
            this.atualizarArmadilha(campoLocal!.id, armLocal.id, { apiId: (resp as any).id });
            item.armadilhaApiId = (resp as any).id;
          } else if (armLocal && (armLocal as any).apiId) {
            item.armadilhaApiId = (armLocal as any).apiId;
          }
        }

        if (item.campoApiId && item.armadilhaApiId) {
          const resp = await firstValueFrom(this.apiService.uploadArmadilhaFoto(item.campoApiId, item.armadilhaApiId, item.dataUrl));
          // atualizar referência local se retornou caminho público
          if (resp && resp.foto) {
            const campoLocal = this.campos.find(c => c.apiId === item.campoApiId);
            const armLocal = campoLocal?.armadilhas.find(a => a.id === item.armadilhaLocalId);
            if (armLocal) this.atualizarArmadilha(campoLocal!.id, armLocal.id, { foto: resp.foto, dataFoto: resp.dataFoto ? new Date(resp.dataFoto) : new Date() });
          }

          // remover item da fila
          this.pendingUploads = this.pendingUploads.filter(p => p !== item);
          this.salvarPendingUploads();
        } else {
          // tentar novamente mais tarde
          item.retries = (item.retries || 0) + 1;
          if (item.retries > 10) {
            // descarta após muitas tentativas
            this.pendingUploads = this.pendingUploads.filter(p => p !== item);
            this.salvarPendingUploads();
          }
        }
      } catch (err) {
        console.warn('Erro processando pending upload:', err);
        item.retries = (item.retries || 0) + 1;
        if (item.retries > 10) {
          this.pendingUploads = this.pendingUploads.filter(p => p !== item);
          this.salvarPendingUploads();
        }
      }
    }
  }

  deletarArmadilha(campoId: string, armadilhaId: string): boolean {
    const campo = this.getCampo(campoId);
    if (campo) {
      const index = campo.armadilhas.findIndex(a => a.id === armadilhaId);
      if (index !== -1) {
        campo.armadilhas.splice(index, 1);
        this.salvarDados();
        
        // Atualiza contagem na API
        this.atualizarContagemArmadilhas(campo);
        
        return true;
      }
    }
    return false;
  }

  // Atualiza contagem de armadilhas na API
  private async atualizarContagemArmadilhas(campo: Campo) {
    if (campo.apiId) {
      try {
        await firstValueFrom(
          this.apiService.atualizarTalhao(campo.apiId, {
            nome: campo.nome,
            area: campo.area,
            status: campo.status
          })
        );
      } catch (error) {
        console.warn('⚠️ Erro ao atualizar contagem na API:', error);
      }
    }
  }

  // ===== ESTATÍSTICAS =====

  contarFotosFaltando(): number {
    let count = 0;
    this.campos.forEach(campo => {
      campo.armadilhas.forEach(armadilha => {
        if (!armadilha.foto) {
          count++;
        }
      });
    });
    return count;
  }

  calcularTaxaConclusao(): number {
    let total = 0;
    let comFoto = 0;
    this.campos.forEach(campo => {
      campo.armadilhas.forEach(armadilha => {
        total++;
        if (armadilha.foto) {
          comFoto++;
        }
      });
    });
    return total > 0 ? (comFoto / total) * 100 : 0;
  }

  // Forçar sincronização manual
  async forcarSincronizacao(): Promise<void> {
    await this.sincronizarComAPI();
  }

  // Gerar ID único
  private gerarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}