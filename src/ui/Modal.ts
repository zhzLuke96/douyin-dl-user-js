/** callback会在创建element之后调用 */
export class Modal {
  overlay: HTMLElement
  root: HTMLElement

  constructor(callback?: (root: HTMLElement, overlay: HTMLElement) => any) {
    this.overlay = document.createElement("div")
    Object.assign(this.overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
    })

    this.root = document.createElement("div")
    Object.assign(this.root.style, {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      minWidth: "300px",
      minHeight: "150px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    })

    this.root.addEventListener("click", (e) => e.stopPropagation())
    this.overlay.addEventListener("click", () => this.close())
    this.overlay.appendChild(this.root)
    document.body.appendChild(this.overlay)

    if (typeof callback === "function") {
      callback(this.root, this.overlay)
    }
  }

  close() {
    this.overlay.remove()
  }
}
