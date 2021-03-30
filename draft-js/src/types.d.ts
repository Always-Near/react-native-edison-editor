declare interface Window {
  ReactNativeWebView: any;
  toggleBlockType: (blockType: string) => void;
  toggleInlineStyle: (inlineStyle: string) => void;
  toggleSpecialType: (command: string) => void;
  setDefaultValue: (html: string) => void;
  setStyle: (style: string) => void;
  setIsDarkMode: (style: string) => void;
  setEditorPlaceholder: (placeholder: string) => void;
  onAddAtomicBlock: (paramsStr: string) => void;
  focusTextEditor: () => void;
  blurTextEditor: () => void;
}
