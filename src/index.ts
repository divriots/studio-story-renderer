import { typeOf, render } from "@divriots/universal-story-render";
import "@webcomponents-dev/json-element";

export async function renderWith(
  require: (dep: string) => any,
  storyResult: unknown,
  div: HTMLElement
): Promise<void> {
  const storyType = typeOf(storyResult);
  const dispose = await render(require, storyResult, storyType, div);

  if (typeof dispose === 'function') {
    const win = div.ownerDocument.defaultView;
    win.addEventListener("unload", dispose);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of Array.from(record.removedNodes || [])) {
          if (node == div) {
            dispose();
            observer.disconnect();
            return;
          }
        }
      }
    });
    if(div.parentNode) observer.observe(div.parentNode, {childList: true});
  }

  if (!dispose) {
    switch (storyType) {
      case "String": {
        const trimmed = (storyResult as string).trim();
        if (trimmed.match(/^<[^>]*>[\s\S]*<\/[^>]*>$/g)) {
          // starts and ends with html tag
          div.innerHTML = trimmed;
          break;
        }
      }
      default: {
        const jsonEl = document.createElement("json-element") as any;
        jsonEl.value = storyResult;
        jsonEl.open = "full";
        div.insertAdjacentElement("beforeend", jsonEl);
        break;
      }
    }
  }
}
