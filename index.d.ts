import { Component } from "react";
import { ViewStyle } from "react-native";
import { StyleType, BlockType } from "edison-editor";
import "./index.html";
export declare type StyleEnum = StyleType;
export declare type BlockTypeEnum = BlockType;
export interface Contact {
  name: string;
  email: string;
}
export interface ContactWithAvatar {
  name: string;
  email: string;
  avatar: string;
}
declare type PropTypes = {
  style?: ViewStyle;
  defaultValue?: string;
  placeholder?: string;
  to?: Contact[];
  cc?: Contact[];
  bcc?: Contact[];
  from?: Contact;
  subject?: string;
  showHeader?: boolean;
  suggestions?: ContactWithAvatar[];
  onEditorReady?: () => void;
  onStyleChanged?: (styles: StyleEnum[]) => void;
  onBlockTypeChanged?: (type: BlockTypeEnum) => void;
  onToChange?: (constactList: Contact[]) => void;
  onCcChange?: (constactList: Contact[]) => void;
  onBccChange?: (constactList: Contact[]) => void;
  onSubjectChange?: (subject: string) => void;
  onSugTextChange?: (subject: string) => void;
  onEditorChange?: (content: string) => void;
  onSizeChange?: (size: number) => void;
  editPosition?: (pos: number) => void;
};
declare class RNDraftView extends Component<PropTypes> {
  private webViewRef;
  state: {
    editorState: string;
  };
  checkSuggestionChange: (
    suggestions?: ContactWithAvatar[] | undefined
  ) => string;
  UNSAFE_componentWillReceiveProps(next: PropTypes): void;
  private executeScript;
  private onMessage;
  private widgetMounted;
  private onAddBlock;
  focus: () => void;
  blur: () => void;
  setBlockType: (blockType: BlockTypeEnum) => void;
  setStyle: (style: StyleEnum) => void;
  addImage: (src: string) => void;
  getEditorState: () => string;
  render(): JSX.Element;
}
export default RNDraftView;
