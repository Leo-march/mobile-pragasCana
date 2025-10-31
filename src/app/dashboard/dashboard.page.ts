import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    private router: Router
  ) { }

  ngOnInit() {
    this.carregarEstatisticas();
  }

  ionViewWillEnter() {
    // Atualiza dados sempre que a página aparecer
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
}