import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Interfaces para a API
export interface UsuarioAPI {
  id: number;
  nome: string;
  email: string;
}

export interface TalhaoAPI {
  id: number;
  nome: string;
  area?: number;
  status?: string;
  ultimaColeta?: string;
  totalPragas?: number;
  armadilhasAtivas?: number;
  center?: [number, number];
  boundary?: any;
  pragas?: any;
}

export interface CriarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
}

export interface CriarTalhaoDTO {
  nome: string;
  area?: number;
  status?: string;
  centerLat?: number;
  centerLng?: number;
  boundaryJson?: any;
  pragasJson?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3333'; // URL da sua API

  constructor(private http: HttpClient) { }

  // ===== USUÁRIOS =====
  
  criarUsuario(dados: CriarUsuarioDTO): Observable<UsuarioAPI> {
    return this.http.post<UsuarioAPI>(`${this.baseUrl}/usuarios`, dados);
  }

  // ===== TALHÕES =====
  
  listarTalhoes(): Observable<TalhaoAPI[]> {
    return this.http.get<TalhaoAPI[]>(`${this.baseUrl}/talhoes`);
  }

  obterTalhao(id: number): Observable<TalhaoAPI> {
    return this.http.get<TalhaoAPI>(`${this.baseUrl}/talhoes/${id}`);
  }

  criarTalhao(dados: CriarTalhaoDTO): Observable<TalhaoAPI> {
    return this.http.post<TalhaoAPI>(`${this.baseUrl}/talhoes`, dados);
  }

  atualizarTalhao(id: number, dados: Partial<CriarTalhaoDTO>): Observable<TalhaoAPI> {
    return this.http.put<TalhaoAPI>(`${this.baseUrl}/talhoes/${id}`, dados);
  }

  deletarTalhao(id: number): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(`${this.baseUrl}/talhoes/${id}`);
  }
}