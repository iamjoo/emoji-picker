import {Component, OnInit} from '@angular/core';

import {Subject} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.ng.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'emoji-picker';
  readonly bareTextContent = new Subject<string>();
  private bareEl: Element;

  ngOnInit(): void {
    this.bareEl = document.getElementById('bare-content');
  }

  bareKeydown(): void {
    setTimeout(() => {
      this.bareTextContent.next(this.bareEl.textContent);
    }, 0);
  }
}
