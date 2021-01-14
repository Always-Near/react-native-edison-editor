import React, { Component } from "react";
import { ViewStyle } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import RNFS from "react-native-fs";
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

type PropTypes = {
  style?: ViewStyle;
  defaultValue?: string;
  placeholder?: string;
  to?: Contact[];
  cc?: Contact[];
  bcc?: Contact[];
  from: Contact;
  subject?: string;
  onEditorReady?: () => void;
  onStyleChanged?: (styles: StyleEnum[]) => void;
  onBlockTypeChanged?: (type: BlockTypeEnum) => void;
  onToChange: (constactList: Contact[]) => void;
  onCcChange: (constactList: Contact[]) => void;
  onBccChange: (constactList: Contact[]) => void;
  onSubjectChange: (subject: string) => void;
};

class RNDraftView extends Component<PropTypes> {
  private webViewRef = React.createRef<WebView>();

  state = {
    editorState: "",
  };

  private executeScript = (functionName: string, parameter?: string) => {
    if (this.webViewRef.current) {
      this.webViewRef.current.injectJavaScript(
        `window.${functionName}(${parameter ? `'${parameter}'` : ""});true;`
      );
    }
  };

  private onMessage = (event: WebViewMessageEvent) => {
    const { onToChange, onCcChange, onBccChange, onSubjectChange } = this.props;
    const { type, data } = JSON.parse(event.nativeEvent.data);
    if (type === "isMounted") {
      this.widgetMounted();
      return;
    }
    if (type === "editorChange") {
      this.setState({ editorState: data.replace(/(\r\n|\n|\r)/gm, "") });
      return;
    }
    if (type === "toChange") {
      onToChange(data);
      return;
    }
    if (type === "ccChange") {
      onCcChange(data);
      return;
    }
    if (type === "bccChange") {
      onBccChange(data);
      return;
    }
    if (type === "subjectChange") {
      onSubjectChange(data);
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
      onEditorReady = () => null,
    } = this.props;
    if (defaultValue) {
      this.executeScript("setDefaultValue", defaultValue);
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
    this.executeScript("setDefaultFrom", JSON.stringify(from));
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
