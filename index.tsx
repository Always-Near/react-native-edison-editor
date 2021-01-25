import React, { Component } from "react";
import { ViewStyle } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import RNFS from "react-native-fs";
import { Buffer } from "buffer";
import {
  StyleType,
  BlockType,
  CustomBlockType,
  BlockProps,
} from "edison-editor";
import Package from "./package.json";

import "./index.html";

export type StyleEnum = StyleType;
export type BlockTypeEnum = BlockType;
export interface Contact {
  name: string;
  email: string;
}

export interface ContactWithAvatar {
  name: string;
  email: string;
  avatar: string;
}

type PropTypes = {
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
};

class RNDraftView extends Component<PropTypes> {
  private webViewRef = React.createRef<WebView>();

  state = {
    editorState: "",
  };

  checkSuggestionChange = (suggestions?: ContactWithAvatar[]) => {
    if (!suggestions) {
      return "";
    }
    return suggestions.reduce((pre, s) => pre + s.email, "");
  };

  UNSAFE_componentWillReceiveProps(next: PropTypes) {
    if (
      this.checkSuggestionChange(next.suggestions) !==
      this.checkSuggestionChange(this.props.suggestions)
    ) {
      this.executeScript(
        "setSuggestions",
        JSON.stringify(next.suggestions || [])
      );
    }
  }

  private executeScript = (functionName: string, parameter?: string) => {
    if (this.webViewRef.current) {
      this.webViewRef.current.injectJavaScript(
        `window.${functionName}(${parameter ? `'${parameter}'` : ""});true;`
      );
    }
  };

  private onMessage = (event: WebViewMessageEvent) => {
    const {
      onToChange,
      onCcChange,
      onBccChange,
      onSubjectChange,
      onSugTextChange,
      onEditorChange,
    } = this.props;
    const { type, data } = JSON.parse(event.nativeEvent.data);
    if (type === "isMounted") {
      this.widgetMounted();
      return;
    }
    if (type === "editorChange") {
      onEditorChange && onEditorChange(data);
      this.setState({ editorState: data.replace(/(\r\n|\n|\r)/gm, "") });
      return;
    }
    if (type === "toChange" && onToChange) {
      onToChange(data);
      return;
    }
    if (type === "ccChange" && onCcChange) {
      onCcChange(data);
      return;
    }
    if (type === "bccChange" && onBccChange) {
      onBccChange(data);
      return;
    }
    if (type === "subjectChange" && onSubjectChange) {
      onSubjectChange(data);
      return;
    }
    if (type === "sugTextChange" && onSugTextChange) {
      onSugTextChange(data);
      return;
    }
  };

  private widgetMounted = () => {
    const {
      placeholder,
      defaultValue,
      to,
      cc,
      bcc,
      from,
      subject,
      showHeader = false,
      onEditorReady = () => null,
    } = this.props;

    this.executeScript("setHeaderVisible", showHeader.toString());

    if (defaultValue) {
      const formatHtml = Buffer.from(defaultValue, "utf-8").toString("base64");
      this.executeScript("setDefaultValue", formatHtml);
    }
    if (placeholder) {
      this.executeScript("setEditorPlaceholder", placeholder);
    }
    if (to) {
      this.executeScript("setDefaultTo", JSON.stringify(to));
    }
    if (cc) {
      this.executeScript("setDefaultCc", JSON.stringify(cc));
    }
    if (bcc) {
      this.executeScript("setDefaultBcc", JSON.stringify(bcc));
    }
    if (from) {
      this.executeScript("setDefaultFrom", JSON.stringify(from));
    }
    if (subject) {
      this.executeScript("setDefaultSubject", subject);
    }
    onEditorReady();
  };

  private onAddBlock = <T extends CustomBlockType>(
    type: T,
    params: BlockProps<T>
  ) => {
    this.executeScript("onAddBlock", JSON.stringify({ type, params }));
  };

  focus = () => {
    this.executeScript("focusTextEditor");
  };

  blur = () => {
    this.executeScript("blurTextEditor");
  };

  setBlockType = (blockType: BlockTypeEnum) => {
    this.executeScript("toggleBlockType", blockType);
  };

  setStyle = (style: StyleEnum) => {
    this.executeScript("toggleInlineStyle", style);
  };

  addImage = (src: string) => {
    this.onAddBlock("image", { src });
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
      />
    );
  }
}

export default RNDraftView;
