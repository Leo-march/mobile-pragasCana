import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KeyboardHelperService {

  constructor() {
    console.log('🚀 KeyboardHelperService iniciado!');
    this.setupKeyboardDetection();
  }

  private setupKeyboardDetection() {
    // Detecta mudanças na viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        this.handleViewportResize();
      });
    }

    // Detecta foco em inputs
    document.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        console.log('🎯 Input ganhou foco!');
        setTimeout(() => {
          this.adjustModalForKeyboard(true);
        }, 300);
      }
    });

    // Detecta perda de foco
    document.addEventListener('focusout', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        console.log('🎯 Input perdeu foco!');
        setTimeout(() => {
          this.adjustModalForKeyboard(false);
        }, 300);
      }
    });
  }

  private handleViewportResize() {
    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const screenHeight = window.screen.height;
    const heightDiff = screenHeight - currentHeight;
    
    console.log('📐 Altura mudou:', heightDiff);
    
    if (heightDiff > 150) {
      console.log('⌨️ TECLADO ABRIU');
      this.adjustModalForKeyboard(true);
    } else if (heightDiff < 100) {
      console.log('⌨️ TECLADO FECHOU');
      this.adjustModalForKeyboard(false);
    }
  }

  private adjustModalForKeyboard(keyboardOpen: boolean) {
    const modals = document.querySelectorAll('.custom-alert-modal');
    
    console.log('🔍 Modais encontrados:', modals.length);
    
    modals.forEach(modal => {
      if (keyboardOpen) {
        modal.classList.add('keyboard-open');
        console.log('✅ Classe keyboard-open ADICIONADA ao modal');
      } else {
        modal.classList.remove('keyboard-open');
        console.log('❌ Classe keyboard-open REMOVIDA do modal');
      }
    });
  }

  // Método público para forçar ajuste manualmente
  public forceAdjustModal(keyboardOpen: boolean) {
    console.log('🔧 Ajuste FORÇADO:', keyboardOpen ? 'ABRIR' : 'FECHAR');
    this.adjustModalForKeyboard(keyboardOpen);
  }
}