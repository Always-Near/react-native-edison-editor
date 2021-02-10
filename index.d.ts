import { Component } from "react";
import { ViewStyle } from "react-native";
import { InlineStyleType } from "edison-editor";
import "./index.html";
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
    onActiveStyleChange?: (styles: string[]) => void;
    onToChange?: (constactList: Contact[]) => void;
    onCcChange?: (constactList: Contact[]) => void;
    onBccChange?: (constactList: Contact[]) => void;
    onSubjectChange?: (subject: string) => void;
    onSugTextChange?: (subject: string) => void;
    onEditorChange?: (content: string) => void;
};
declare class RNDraftView extends Component<PropTypes> {
    private webViewRef;
    state: {
        editorState: string;
    };
    checkSuggestionChange: (suggestions?: ContactWithAvatar[] | undefined) => string;
    UNSAFE_componentWillReceiveProps(next: PropTypes): void;
    private executeScript;
    private onMessage;
    private widgetMounted;
    private onAddAtomicBlock;
    focus: () => void;
    blur: () => void;
    setStyle: (style: InlineStyleType) => void;
    setBlockType: (blockType: "unordered-list-item" | "ordered-list-item") => void;
    setSpecialType: (command: "CLEAR" | "IndentIncrease" | "IndentDecrease") => void;
    addImage: (src: string) => void;
    getEditorState: () => string;
    render(): JSX.Element;
}
export default RNDraftView;
