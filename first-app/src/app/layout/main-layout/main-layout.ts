import { Component } from '@angular/core';
import { Header } from "../header/header";
import { Sidebar } from "../sidebar/sidebar";
import { Footer } from "../footer/footer";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-main-layout',
  imports: [Header, Sidebar, Footer, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {}
