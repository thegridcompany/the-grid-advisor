import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SectionView } from "./SectionView";

export const SectionNode = Node.create({
  name: "section",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      "data-section-type": {
        default: "generic",
      },
    };
  },

  parseHTML() {
    return [{ tag: "section[data-section-type]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["section", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionView);
  },
});
