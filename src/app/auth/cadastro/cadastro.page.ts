import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: false
})
export class CadastroPage implements OnInit {
  nome = '';
  email = '';
  telefone = '';
  senha = '';
  confirmarSenha = '';
  mostrarSenha = false;
  mostrarConfirmarSenha = false;

  constructor(private router: Router) { }

  ngOnInit() {
  }

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleMostrarConfirmarSenha() {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  fazerCadastro() {
    // Navega direto para o dashboard (não funcional)
    this.router.navigate(['/dashboard']);
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}