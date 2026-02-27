import { LitElement, html, css } from "lit";
import "@material/web/switch/switch.js";

export class Switch extends LitElement {
  static properties = {
    disabled: { type: Boolean },
    selected: { type: Boolean },
    icons: { type: Boolean },
    showOnlySelectedIcon: { type: Boolean },
    label: { type: String },
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  `;

  constructor() {
    super();
    this.disabled = false;
    this.selected = false;
    this.icons = false;
    this.showOnlySelectedIcon = false;
    this.label = "";
  }

  render() {
    return html`
      ${this.label
        ? html`
            <label>
              ${this.label}
              <md-switch
                @change=${(e) => (this.selected = e.target.selected)}
                aria-label=${this.label}
                .disabled=${this.disabled}
                .selected=${this.selected}
                .icons=${this.icons}
                .showOnlySelectedIcon=${this.showOnlySelectedIcon}>
              </md-switch>
            </label>
          `
        : html`
            <md-switch
              @change=${(e) => (this.selected = e.target.selected)}
              aria-label="switch"
              .disabled=${this.disabled}
              .selected=${this.selected}
              .icons=${this.icons}
              .showOnlySelectedIcon=${this.showOnlySelectedIcon}>
            </md-switch>
          `}
    `;
  }
}

customElements.define("lit-switch", Switch);