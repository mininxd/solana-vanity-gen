import { LitElement, html, css } from "lit";
import "@material/web/progress/linear-progress.js";

export class LinearProgress extends LitElement {
  static properties = {
    value: { type: Number },          // 0 → 1
    buffer: { type: Number },         // 0 → 1
    indeterminate: { type: Boolean },
    disabled: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      border: 1px solid rgba(0, 0, 0, 0.5);
    }

    md-linear-progress {
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.value = 0;
    this.buffer = 1;
    this.indeterminate = false;
    this.disabled = false;
  }

  render() {
    return html`
      <md-linear-progress
        .value=${this.value}
        .buffer=${this.buffer}
        .indeterminate=${this.indeterminate}
        .disabled=${this.disabled}>
      </md-linear-progress>
    `;
  }
}

customElements.define("lit-progress", LinearProgress);