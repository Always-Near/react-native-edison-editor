import React, { Component } from "react";
import { ViewStyle, Platform } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import {
  StyleType,
  BlockType,
  CustomBlockType,
  BlockProps,
} from "edison-editor-near";
const draftJsHtml = require("./index.html");

export type StyleEnum = StyleType;
export type BlockTypeEnum = BlockType;

type PropTypes = {
  style?: ViewStyle;
  defaultValue?: string;
  placeholder?: string;
  onEditorReady?: () => void;
  onStyleChanged?: (styles: StyleEnum[]) => void;
  onBlockTypeChanged?: (type: BlockTypeEnum) => void;
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
    const { onStyleChanged, onBlockTypeChanged } = this.props;
    const { data } = event.nativeEvent;
    const { blockType, styles, editorState, isMounted } = JSON.parse(data);
    if (onStyleChanged) {
      onStyleChanged(styles ? styles.split(",") : []);
    }
    if (blockType) {
      onBlockTypeChanged(blockType);
    }
    if (editorState) {
      this.setState({ editorState: editorState.replace(/(\r\n|\n|\r)/gm, "") });
    }
    if (isMounted) {
      this.widgetMounted();
    }
  };

  private widgetMounted = () => {
    const {
      placeholder,
      defaultValue,
      onEditorReady = () => null,
    } = this.props;
    if (defaultValue) {
      this.executeScript("setDefaultValue", defaultValue);
    }
    if (placeholder) {
      this.executeScript("setEditorPlaceholder", placeholder);
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
    return (
      <WebView
        ref={this.webViewRef}
        style={style}
        source={
          Platform.OS === "ios"
            ? draftJsHtml
            : { uri: "file:///android_asset/index.html" }
        }
        keyboardDisplayRequiresUserAction={false}
        originWhitelist={["*"]}
        onMessage={this.onMessage}
      />
    );
  }
}

export default RNDraftView;
