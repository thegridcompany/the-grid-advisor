import { Extension } from "@tiptap/core";

export const Validation = Extension.create({
  name: "validation",

  addGlobalAttributes() {
    return [
      {
        types: ["doc"],
        attributes: {
          "data-validation-state": {
            default: "valid",
            rendered: false,
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [];
  },

  onUpdate() {
    const { doc } = this.editor.state;
    let isValid = true;
    const invalidNodes: string[] = [];

    // Check if all top-level nodes are sections
    doc.content.forEach((node, index) => {
      if (node.type.name !== "section") {
        isValid = false;
        invalidNodes.push(`Node ${index + 1}: ${node.type.name}`);
      }
    });

    const editorElement = this.editor.view.dom;

    // Remove previous validation classes
    editorElement.classList.remove("blueprint-valid", "blueprint-invalid");

    if (isValid) {
      editorElement.classList.add("blueprint-valid");
      editorElement.removeAttribute("data-validation-errors");
    } else {
      editorElement.classList.add("blueprint-invalid");
      editorElement.setAttribute(
        "data-validation-errors",
        invalidNodes.join(", ")
      );

      // Add subtle visual feedback
      if (!editorElement.querySelector(".validation-hint")) {
        const hint = document.createElement("div");
        hint.className =
          "validation-hint absolute top-2 right-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-md opacity-75";
        hint.textContent = "Struttura non valida";
        hint.style.pointerEvents = "none";
        editorElement.style.position = "relative";
        editorElement.appendChild(hint);

        // Auto-remove after 3 seconds
        setTimeout(() => {
          hint.remove();
        }, 3000);
      }
    }

    // Update the editor's validation state
    this.editor.commands.updateAttributes("doc", {
      "data-validation-state": isValid ? "valid" : "invalid",
    });
  },
});
