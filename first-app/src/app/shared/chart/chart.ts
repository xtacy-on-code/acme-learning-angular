import { Component, effect, ElementRef, input, viewChild, OnDestroy } from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

// Register only the controllers/elements/scales/plugins this app actually uses.
// Chart.js is tree-shakeable, so nothing is pulled in until it's registered here.
Chart.register(
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

/**
 * Reusable canvas chart. Hand it a Chart.js `config` (a signal input) and it owns the
 * full lifecycle: it (re)creates the chart whenever the config changes and destroys the
 * instance on cleanup. Because the input is a signal, passing a brand-new config — e.g.
 * after the data or the theme colors change — re-runs the effect and redraws.
 */
@Component({
  selector: 'app-chart',
  imports: [],
  templateUrl: './chart.html',
})
export class ChartComponent implements OnDestroy {
  config = input.required<ChartConfiguration>();

  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    // Runs once the canvas exists and re-runs whenever `config()` changes. Tearing the
    // old instance down before each rebuild avoids leaking canvases/listeners and the
    // "Canvas is already in use" error.
    effect(() => {
      const config = this.config();
      const canvas = this.canvasRef().nativeElement;

      this.chart?.destroy();
      this.chart = new Chart(canvas, config);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
