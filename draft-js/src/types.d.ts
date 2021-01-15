declare interface Window {
  ReactNativeWebView: any;
  toggleBlockType: (blockType: string) => void;
  toggleInlineStyle: (inlineStyle: string) => void;
  setHeaderVisible: (headerVisible: string) => void;
  setDefaultValue: (html: string) => void;
  setEditorPlaceholder: (placeholder: string) => void;
  setDefaultTo: (contactList: string) => void;
  setDefaultCc: (contactList: string) => void;
  setDefaultBcc: (contactList: string) => void;
  setDefaultFrom: (contact: string) => void;
  setDefaultSubject: (subject: string) => void;
  setSuggestions: (contactList: string) => void;
  onAddBlock: (paramsStr: string) => void;
  focusTextEditor: () => void;
  blurTextEditor: () => void;
}

interface Contact {
  name: string;
  email: string;
}

interface ContactWithAvatar {
  name: string;
  email: string;
  avatar: string;
}
