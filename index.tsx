import React, { Component } from "react";
import { ViewStyle } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import RNFS from "react-native-fs";
import { Buffer } from "buffer";
import {
  AtomicBlockType,
  AtomicBlockProps,
  InlineStyleType,
} from "edison-editor";
import Package from "./package.json";

import "./index.html";

// It must be consistent with `draft-js/src/types.d.ts`
const InjectScriptName = {
  ToggleBlockType: "toggleBlockType",
  ToggleInlineStyle: "toggleInlineStyle",
  ToggleSpecialType: "toggleSpecialType",
  SetDefaultValue: "setDefaultValue",
  SetEditorPlaceholder: "setEditorPlaceholder",
  OnAddAtomicBlock: "onAddAtomicBlock",
  FocusTextEditor: "focusTextEditor",
  BlurTextEditor: "blurTextEditor",
} as const;

// It must be consistent with `draft-js/src/App.tsx`
const EventName = {
  IsMounted: "isMounted",
  EditorChange: "editorChange",
  ActiveStyleChange: "activeStyleChange",
  SizeChange: "sizeChange",
  EditPosition: "editPosition",
  OnFocus: "onFocus",
  OnBlur: "onBlur",
} as const;

type PropTypes = {
  style?: ViewStyle;
  defaultValue?: string;
  placeholder?: string;
  onEditorReady?: () => void;
  onActiveStyleChange?: (styles: string[]) => void;
  onSizeChange?: (size: number) => void;
  editPosition?: (pos: number) => void;
  onEditorChange?: (content: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

class RNDraftView extends Component<PropTypes> {
  private webViewRef = React.createRef<WebView>();

  state = {
    editorState: "",
  };

  private executeScript = (
    functionName: typeof InjectScriptName[keyof typeof InjectScriptName],
    parameter?: string
  ) => {
    if (this.webViewRef.current) {
      this.webViewRef.current.injectJavaScript(
        `window.${functionName}(${parameter ? `'${parameter}'` : ""});true;`
      );
    }
  };

  private onMessage = (event: WebViewMessageEvent) => {
    const {
      onEditorChange,
      onActiveStyleChange,
      editPosition,
      onSizeChange,
      onBlur,
      onFocus,
    } = this.props;
    const {
      type,
      data,
    }: {
      type: typeof EventName[keyof typeof EventName];
      data: any;
    } = JSON.parse(event.nativeEvent.data);
    if (type === EventName.IsMounted) {
      this.widgetMounted();
      return;
    }
    if (type === EventName.EditorChange) {
      onEditorChange && onEditorChange(data.replace(/(\r\n|\n|\r)/gm, ""));
      this.setState({ editorState: data.replace(/(\r\n|\n|\r)/gm, "") });
      return;
    }
    if (type === EventName.ActiveStyleChange) {
      onActiveStyleChange && onActiveStyleChange(data);
    }
    if (type === EventName.EditPosition && editPosition) {
      editPosition(data);
      return;
    }
    if (type === EventName.SizeChange && onSizeChange) {
      onSizeChange(data);
      return;
    }
    if (type === EventName.OnBlur && onBlur) {
      onBlur();
      return;
    }
    if (type === EventName.OnFocus && onFocus) {
      onFocus();
      return;
    }
  };

  private widgetMounted = () => {
    const {
      placeholder,
      defaultValue,
      onEditorReady = () => null,
    } = this.props;

    if (defaultValue) {
      const formatHtml = Buffer.from(defaultValue, "utf-8").toString("base64");
      this.executeScript(InjectScriptName.SetDefaultValue, formatHtml);
    }
    if (placeholder) {
      this.executeScript(InjectScriptName.SetEditorPlaceholder, placeholder);
    }
    onEditorReady();
  };

  private onAddAtomicBlock = <T extends AtomicBlockType>(
    type: T,
    params: AtomicBlockProps<T>
  ) => {
    this.executeScript(
      InjectScriptName.OnAddAtomicBlock,
      JSON.stringify({ type, params })
    );
  };

  focus = () => {
    this.executeScript(InjectScriptName.FocusTextEditor);
  };

  blur = () => {
    this.executeScript(InjectScriptName.BlurTextEditor);
  };

  setStyle = (style: InlineStyleType) => {
    this.executeScript(InjectScriptName.ToggleInlineStyle, style);
  };

  setBlockType = (blockType: "unordered-list-item" | "ordered-list-item") => {
    this.executeScript(InjectScriptName.ToggleBlockType, blockType);
  };

  setSpecialType = (command: "CLEAR" | "IndentIncrease" | "IndentDecrease") => {
    this.executeScript(InjectScriptName.ToggleSpecialType, command);
  };

  addImage = (src: string) => {
    this.onAddAtomicBlock("image", { src });
  };

  getEditorState = () => {
    return this.state.editorState;
  };

  render() {
    const { style = { flex: 1 } } = this.props;
    const htmlPath = `file://${RNFS.MainBundlePath}/assets/node_modules/${Package.name}/index.html`;
    return (
      <WebView
        ref={this.webViewRef}
        style={style}
        source={{ uri: htmlPath }}
        keyboardDisplayRequiresUserAction={false}
        originWhitelist={["*"]}
        onMessage={this.onMessage}
        scrollEnabled={false}
      />
    );
  }
}

export default RNDraftView;
