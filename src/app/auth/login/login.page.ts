import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  email = '';
  senha = '';
  mostrarSenha = false;

  constructor(private router: Router) { }

  ngOnInit() {
  }

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  fazerLogin() {
    // Navega direto para o dashboard (não funcional)
    this.router.navigate(['/dashboard']);
  }

  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }
}