import { ProsemirrorJSON } from "@/features/blueprint/components/BlueprintEditor";

const mockBlueprint: ProsemirrorJSON = {
  type: "doc",
  content: [
    {
      type: "section",
      attrs: { "data-section-type": "title" },
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Mock Blueprint Title" }],
        },
      ],
    },
    {
      type: "section",
      attrs: { "data-section-type": "roadmap" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Phase 1: Mock Data" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "This is a mock blueprint loaded from a simulated API.",
            },
          ],
        },
      ],
    },
  ],
};

export const fetchBlueprint = (): Promise<ProsemirrorJSON> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockBlueprint);
    }, 1000);
  });
};
