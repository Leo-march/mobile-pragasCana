import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  constructor() { }

  async takePicture(): Promise<UserPhoto | null> {
    try {
      // Tira a foto usando a câmera do dispositivo
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        saveToGallery: true
      });

      return {
        filepath: photo.path || '',
        webviewPath: photo.webPath
      };
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      return null;
    }
  }

  async selectFromGallery(): Promise<UserPhoto | null> {
    try {
      // Seleciona foto da galeria
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
        allowEditing: false
      });

      return {
        filepath: photo.path || '',
        webviewPath: photo.webPath
      };
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      return null;
    }
  }
}