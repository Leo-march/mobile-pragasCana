import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  fotosFaltando = 0;
  taxaConclusao = 0;
  totalCampos = 0;
  totalArmadilhas = 0;

  constructor(
    private dataService: DataService,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.carregarEstatisticas();
  }

  ionViewWillEnter() {
    this.carregarEstatisticas();
  }

  carregarEstatisticas() {
    this.fotosFaltando = this.dataService.contarFotosFaltando();
    this.taxaConclusao = this.dataService.calcularTaxaConclusao();
    
    const campos = this.dataService.getCampos();
    this.totalCampos = campos.length;
    this.totalArmadilhas = campos.reduce((total, campo) => 
      total + campo.armadilhas.length, 0
    );
  }

  navegarParaCampos() {
    this.router.navigate(['/campos']);
  }

  async mostrarDetalhesFotosFaltando() {
    const campos = this.dataService.getCampos();
    const detalhes: { nome: string; faltando: number }[] = [];
    
    // Calcular fotos faltando por talhão
    campos.forEach(campo => {
      const fotosFaltando = campo.armadilhas.filter(a => !a.foto).length;
      if (fotosFaltando > 0) {
        detalhes.push({
          nome: campo.nome,
          faltando: fotosFaltando
        });
      }
    });

    if (detalhes.length === 0) {
      // Nenhuma foto faltando
      const alert = await this.alertController.create({
        header: '✅ Parabéns!',
        message: 'Todas as armadilhas já possuem fotos registradas!',
        cssClass: 'custom-alert-modal',
        buttons: [
          {
            text: 'OK',
            cssClass: 'alert-button-confirm'
          }
        ]
      });
      await alert.present();
      return;
    }

    // Criar mensagem de texto simples formatada
    let mensagem = `Total: ${this.fotosFaltando} ${this.fotosFaltando === 1 ? 'foto faltando' : 'fotos faltando'}\n\n`;
    
    detalhes.forEach((item, index) => {
      const texto = item.faltando === 1 ? 'foto' : 'fotos';
      mensagem += `📍 ${item.nome}\n   ${item.faltando} ${texto} faltando\n\n`;
    });

    const alert = await this.alertController.create({
      header: '📸 Fotos Faltando por Talhão',
      message: mensagem,
      cssClass: 'custom-alert-modal fotos-faltando-alert',
      buttons: [
        {
          text: 'Fechar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Ver Talhões',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.navegarParaCampos();
          }
        }
      ]
    });

    await alert.present();
  }

  async adicionarNovoTalhao() {
    const alert = await this.alertController.create({
      header: 'Novo Talhão',
      cssClass: 'custom-alert-modal',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome do talhão',
          attributes: {
            required: true,
            maxlength: 50
          }
        },
        {
          name: 'localizacao',
          type: 'text',
          placeholder: 'Localização (opcional)',
          attributes: {
            maxlength: 100
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Criar',
          cssClass: 'alert-button-confirm',
          handler: (data) => {
            if (data.nome && data.nome.trim()) {
              this.dataService.criarCampo(data.nome.trim(), data.localizacao?.trim());
              this.carregarEstatisticas();
              this.router.navigate(['/campos']);
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
    
    setTimeout(() => {
      const firstInput = document.querySelector('ion-alert input') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 300);
  }
}