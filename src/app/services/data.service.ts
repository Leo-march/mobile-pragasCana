import { Injectable } from '@angular/core';
import { ApiService, TalhaoAPI } from './api.service';
import { firstValueFrom } from 'rxjs';

// Interfaces locais (mantidas para compatibilidade)
export interface Armadilha {
  id: string;
  nome: string;
  foto?: string;
  dataFoto?: Date;
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
  private sincronizando = false;

  constructor(private apiService: ApiService) {
    this.inicializar();
  }

  private async inicializar() {
    // Carrega dados locais primeiro
    this.carregarDados();
    
    // Tenta sincronizar com a API
    await this.sincronizarComAPI();
  }

  // Sincronização com API
  private async sincronizarComAPI() {
    if (this.sincronizando) return;
    
    try {
      this.sincronizando = true;
      console.log('🔄 Sincronizando com API...');
      
      const talhoesAPI = await firstValueFrom(this.apiService.listarTalhoes());
      
      // Mescla dados da API com dados locais
      talhoesAPI.forEach(talhaoAPI => {
        const campoLocal = this.campos.find(c => c.apiId === talhaoAPI.id);
        
        if (campoLocal) {
          // Atualiza campo existente
          campoLocal.nome = talhaoAPI.nome;
          campoLocal.area = talhaoAPI.area;
          campoLocal.status = talhaoAPI.status;
        } else {
          // Cria novo campo a partir da API
          const novoCampo: Campo = {
            id: this.gerarId(),
            apiId: talhaoAPI.id,
            nome: talhaoAPI.nome,
            area: talhaoAPI.area,
            status: talhaoAPI.status,
            dataCriacao: new Date(),
            armadilhas: []
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
      
      return novaArmadilha;
    }
    return null;
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
    return this.atualizarArmadilha(campoId, armadilhaId, {
      foto,
      dataFoto: new Date()
    });
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