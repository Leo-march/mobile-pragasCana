import { Injectable } from '@angular/core';

// Interfaces para tipar nossos dados
export interface Armadilha {
  id: string;
  nome: string;
  foto?: string; // Base64 da foto
  dataFoto?: Date;
  observacoes?: string;
}

export interface Campo {
  id: string;
  nome: string;
  localizacao?: string;
  dataCriacao: Date;
  armadilhas: Armadilha[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private campos: Campo[] = [];
  private readonly STORAGE_KEY = 'campos_data';

  constructor() {
    this.carregarDados();
  }

  // Carregar dados do localStorage
  private carregarDados() {
    const dados = localStorage.getItem(this.STORAGE_KEY);
    if (dados) {
      this.campos = JSON.parse(dados);
      // Converter strings de data de volta para objetos Date
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

  // Listar todos os campos
  getCampos(): Campo[] {
    return this.campos;
  }

  // Buscar um campo por ID
  getCampo(id: string): Campo | undefined {
    return this.campos.find(c => c.id === id);
  }

  // Criar novo campo
  criarCampo(nome: string, localizacao?: string): Campo {
    const novoCampo: Campo = {
      id: this.gerarId(),
      nome,
      localizacao,
      dataCriacao: new Date(),
      armadilhas: []
    };
    this.campos.push(novoCampo);
    this.salvarDados();
    return novoCampo;
  }

  // Atualizar campo
  atualizarCampo(id: string, dados: Partial<Campo>): boolean {
    const index = this.campos.findIndex(c => c.id === id);
    if (index !== -1) {
      this.campos[index] = { ...this.campos[index], ...dados };
      this.salvarDados();
      return true;
    }
    return false;
  }

  // Deletar campo
  deletarCampo(id: string): boolean {
    const index = this.campos.findIndex(c => c.id === id);
    if (index !== -1) {
      this.campos.splice(index, 1);
      this.salvarDados();
      return true;
    }
    return false;
  }

  // ===== OPERAÇÕES COM ARMADILHAS =====

  // Adicionar armadilha a um campo
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
      return novaArmadilha;
    }
    return null;
  }

  // Atualizar armadilha
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

  // Adicionar foto a uma armadilha
  adicionarFoto(campoId: string, armadilhaId: string, foto: string): boolean {
    return this.atualizarArmadilha(campoId, armadilhaId, {
      foto,
      dataFoto: new Date()
    });
  }

  // Deletar armadilha
  deletarArmadilha(campoId: string, armadilhaId: string): boolean {
    const campo = this.getCampo(campoId);
    if (campo) {
      const index = campo.armadilhas.findIndex(a => a.id === armadilhaId);
      if (index !== -1) {
        campo.armadilhas.splice(index, 1);
        this.salvarDados();
        return true;
      }
    }
    return false;
  }

  // ===== ESTATÍSTICAS =====

  // Contar fotos faltando
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

  // Taxa de conclusão (armadilhas com foto)
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

  // Gerar ID único
  private gerarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}