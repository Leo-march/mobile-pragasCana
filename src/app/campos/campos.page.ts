import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { DataService, Campo } from '../services/data.service';

@Component({
  selector: 'app-campos',
  templateUrl: './campos.page.html',
  styleUrls: ['./campos.page.scss'],
  standalone: false
})
export class CamposPage implements OnInit {
  campos: Campo[] = [];

  constructor(
    private dataService: DataService,
    private router: Router,
    private alertController: AlertController,
    private navController: NavController
  ) { }

  ngOnInit() {
    this.carregarCampos();
  }

  ionViewWillEnter() {
    this.carregarCampos();
  }

  carregarCampos() {
    this.campos = this.dataService.getCampos();
  }

  async novoCampo() {
    const alert = await this.alertController.create({
      header: 'Novo Talhão',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome do talhão',
          attributes: {
            required: true
          }
        },
        {
          name: 'localizacao',
          type: 'text',
          placeholder: 'Localização (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Criar',
          handler: (data) => {
            if (data.nome && data.nome.trim()) {
              this.dataService.criarCampo(data.nome.trim(), data.localizacao?.trim());
              this.carregarCampos();
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
  }

  async editarCampo(campo: Campo) {
    const alert = await this.alertController.create({
      header: 'Editar Campo',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome do campo',
          value: campo.nome
        },
        {
          name: 'localizacao',
          type: 'text',
          placeholder: 'Localização',
          value: campo.localizacao || ''
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Salvar',
          handler: (data) => {
            if (data.nome && data.nome.trim()) {
              this.dataService.atualizarCampo(campo.id, {
                nome: data.nome.trim(),
                localizacao: data.localizacao?.trim()
              });
              this.carregarCampos();
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
  }

  async deletarCampo(campo: Campo) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Deseja realmente deletar o talhão "${campo.nome}"? Todas as armadilhas serão perdidas.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Deletar',
          role: 'destructive',
          handler: () => {
            this.dataService.deletarCampo(campo.id);
            this.carregarCampos();
          }
        }
      ]
    });

    await alert.present();
  }

  abrirCampo(campo: Campo) {
    this.router.navigate(['/campo-detail'], {
      queryParams: { id: campo.id }
    });
  }

  voltarParaDashboard() {
    this.navController.back();
  }

  contarFotos(campo: Campo): number {
    return campo.armadilhas.filter(a => a.foto).length;
  }

  calcularProgresso(campo: Campo): number {
    if (campo.armadilhas.length === 0) return 0;
    return this.contarFotos(campo) / campo.armadilhas.length;
  }
}