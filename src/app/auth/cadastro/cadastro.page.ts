import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

  constructor(
    private router: Router,
    private navController: NavController,
    private http: HttpClient,
    private alertCtrl: AlertController
  ) {
    console.log('🟢 CadastroPage: Construtor chamado');
  }

  ngOnInit() {
    console.log('🟢 CadastroPage: ngOnInit chamado');
  }

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleMostrarConfirmarSenha() {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  fazerCadastro() {
    this._doCadastro();
  }

  private async _doCadastro() {
    // validações básicas
    if (!this.nome || !this.email || !this.senha || !this.confirmarSenha) {
      return this.showAlert('Campos inválidos', 'Preencha todos os campos obrigatórios.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      return this.showAlert('Email inválido', 'Digite um email válido.');
    }

    if (this.senha !== this.confirmarSenha) {
      return this.showAlert('Senhas não coincidem', 'As senhas digitadas não batem.');
    }

    if (this.senha.length < 8) {
      return this.showAlert('Senha fraca', 'A senha deve ter pelo menos 8 caracteres.');
    }

    const payload = {
      nome: this.nome,
      email: this.email,
      senha: this.senha
    };

    try {
      const url = `${environment.apiUrl}/usuarios`;
      console.log('Enviando cadastro para', url);
      await this.http.post(url, payload).toPromise();

      // Após criar usuário, realizar login automático para obter token
      const loginUrl = `${environment.apiUrl}/usuarios/login`;
      const loginResp: any = await this.http.post(loginUrl, { email: this.email, senha: this.senha }).toPromise();
      if (loginResp && loginResp.token) {
        localStorage.setItem('token', loginResp.token);
      }

      await this.showAlert('Conta criada', 'Cadastro realizado com sucesso.');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Erro cadastro:', err);
      const msg = err?.error?.erro || err?.message || 'Erro ao criar conta';
      this.showAlert('Erro', msg);
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  voltarParaLogin() {
    console.log('🔄 Voltando para login...');
    this.navController.back();
  }
}