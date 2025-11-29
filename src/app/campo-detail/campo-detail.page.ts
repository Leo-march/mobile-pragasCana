import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ActionSheetController, NavController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DataService, Campo, Armadilha } from '../services/data.service';

@Component({
  selector: 'app-campo-detail',
  templateUrl: './campo-detail.page.html',
  styleUrls: ['./campo-detail.page.scss'],
  standalone: false
})
export class CampoDetailPage implements OnInit {
  campo?: Campo;
  campoId?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private navController: NavController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.campoId = params['id'];
      this.carregarCampo();
    });
  }

  ionViewWillEnter() {
    this.carregarCampo();
  }

  carregarCampo() {
    if (this.campoId) {
      this.campo = this.dataService.getCampo(this.campoId);
      if (!this.campo) {
        // Campo não encontrado, volta para lista
        this.navController.back();
      }
    }
  }

  async novaArmadilha() {
    const alert = await this.alertController.create({
      header: 'Nova Armadilha',
      cssClass: 'custom-alert-modal',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome/Número da armadilha',
          attributes: {
            required: true,
            maxlength: 50
          }
        },
        {
          name: 'observacoes',
          type: 'textarea',
          placeholder: 'Observações (opcional)',
          attributes: {
            maxlength: 200
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
            if (data.nome && data.nome.trim() && this.campoId) {
              this.dataService.adicionarArmadilha(
                this.campoId,
                data.nome.trim(),
                data.observacoes?.trim()
              );
              this.carregarCampo();
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
    
    // Força o foco no primeiro input após um pequeno delay
    setTimeout(() => {
      const firstInput = document.querySelector('ion-alert input') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 300);
  }

  async editarArmadilha(armadilha: Armadilha) {
    const alert = await this.alertController.create({
      header: 'Editar Armadilha',
      cssClass: 'custom-alert-modal',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome/Número',
          value: armadilha.nome,
          attributes: {
            maxlength: 50
          }
        },
        {
          name: 'observacoes',
          type: 'textarea',
          placeholder: 'Observações',
          value: armadilha.observacoes || '',
          attributes: {
            maxlength: 200
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
          text: 'Salvar',
          cssClass: 'alert-button-confirm',
          handler: (data) => {
            if (data.nome && data.nome.trim() && this.campoId) {
              this.dataService.atualizarArmadilha(this.campoId, armadilha.id, {
                nome: data.nome.trim(),
                observacoes: data.observacoes?.trim()
              });
              this.carregarCampo();
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

  async deletarArmadilha(armadilha: Armadilha) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Deseja realmente deletar a armadilha "${armadilha.nome}"?`,
      cssClass: 'custom-alert-modal',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Deletar',
          cssClass: 'alert-button-confirm',
          handler: () => {
            if (this.campoId) {
              this.dataService.deletarArmadilha(this.campoId, armadilha.id);
              this.carregarCampo();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async tirarFoto(armadilha: Armadilha) {
    try {
      // Solicitar permissões da câmera
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      // Salvar a foto
      if (image.dataUrl && this.campoId) {
        this.dataService.adicionarFoto(this.campoId, armadilha.id, image.dataUrl);
        this.carregarCampo();
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Não foi possível acessar a câmera. Verifique as permissões.',
        cssClass: 'custom-alert-modal',
        buttons: [
          {
            text: 'OK',
            cssClass: 'alert-button-confirm'
          }
        ]
      });
      await alert.present();
    }
  }

  async visualizarFoto(armadilha: Armadilha) {
    if (!armadilha.foto) return;

    const actionSheet = await this.actionSheetController.create({
      header: `Foto - ${armadilha.nome}`,
      cssClass: 'custom-action-sheet',
      buttons: [
        {
          text: 'Tirar Nova Foto',
          icon: 'camera',
          handler: () => {
            this.tirarFoto(armadilha);
          }
        },
        {
          text: 'Remover Foto',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.removerFoto(armadilha);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async removerFoto(armadilha: Armadilha) {
    if (this.campoId) {
      this.dataService.atualizarArmadilha(this.campoId, armadilha.id, {
        foto: undefined,
        dataFoto: undefined
      });
      this.carregarCampo();
    }
  }

  voltar() {
    this.navController.back();
  }
}