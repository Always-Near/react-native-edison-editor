import React, { Component } from "react";
import { ViewStyle, Animated } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import RNFS from "react-native-fs";
import { Buffer } from "buffer";
import {
  AtomicEntityTypes,
  AtomicEntityProps,
  LinkProps,
  InlineStyleType,
} from "edison-editor";
import Package from "./package.json";

import "./index.html";

export type { InlineStyleType } from "edison-editor";
export type { AtomicEntityTypes, AtomicEntityProps } from "edison-editor";

let draftJsFilePath = `${RNFS.CachesDirectoryPath}/draftjs.html`;
const htmlPath = `file://${RNFS.MainBundlePath}/assets/node_modules/${Package.name}/index.html`;

async function copyFile() {
  try {
    if (RNFS.exists(draftJsFilePath)) {
      await RNFS.unlink(draftJsFilePath);
    }
    await RNFS.copyFile(htmlPath, draftJsFilePath);
  } catch (err) {
    // badcase remedy
    draftJsFilePath = htmlPath;
  }
}

copyFile();

// It must be consistent with `draft-js/src/types.d.ts`
const InjectScriptName = {
  ToggleBlockType: "toggleBlockType",
  ToggleInlineStyle: "toggleInlineStyle",
  ToggleSpecialType: "toggleSpecialType",
  SetDefaultValue: "setDefaultValue",
  SetStyle: "setStyle",
  SetIsDarkMode: "setIsDarkMode",
  SetEditorPlaceholder: "setEditorPlaceholder",
  OnAddAtomicBlock: "onAddAtomicBlock",
  OnAddLink: "onAddLink",
  FocusTextEditor: "focusTextEditor",
  BlurTextEditor: "blurTextEditor",
} as const;

// It must be consistent with `draft-js/src/App.tsx`
const EventName = {
  IsMounted: "isMounted",
  EditorChange: "editorChange",
  ContentChange: "contentChange",
  ActiveStyleChange: "activeStyleChange",
  SizeChange: "sizeChange",
  EditPosition: "editPosition",
  OnFocus: "onFocus",
  OnBlur: "onBlur",
  OnPastedFiles: "onPastedFiles",
  OnDroppedFiles: "onDroppedFiles",
} as const;

type File = {
  name: string;
  size: number;
  type: string;
  data: string;
};

type PropTypes = {
  style?: ViewStyle;
  contentStyle?: React.CSSProperties;
  defaultValue?: string;
  placeholder?: string;
  isDarkMode?: boolean;
  onEditorReady?: () => void;
  onActiveStyleChange?: (styles: InlineStyleType[]) => void;
  onSizeChange?: (size: number) => void;
  editPosition?: (pos: number) => void;
  onEditorChange?: (content: string) => void;
  onContentChange?: () => void;
  onPastedFiles?: (files: File[]) => void;
  onDroppedFiles?: (files: File[]) => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

class RNDraftView extends Component<PropTypes> {
  private webViewRef = React.createRef<WebView>();
  private webviewMounted: boolean = false;
  loadingOpacity = new Animated.Value(1);

  state = {
    editorState: "",
    loading: true,
  };

  UNSAFE_componentWillReceiveProps = (nextProps: PropTypes) => {
    if (!this.webviewMounted) {
      return;
    }
    if (
      nextProps.isDarkMode !== undefined &&
      nextProps.isDarkMode !== this.props.isDarkMode
    ) {
      this.executeScript(
        InjectScriptName.SetIsDarkMode,
        nextProps.isDarkMode.toString()
      );
    }
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
      onContentChange,
      onPastedFiles,
      onDroppedFiles,
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
    if (type === EventName.ContentChange && onContentChange) {
      onContentChange();
      return;
    }
    if (type === EventName.OnPastedFiles && onPastedFiles) {
      onPastedFiles(data);
      return;
    }
    if (type === EventName.OnDroppedFiles && onDroppedFiles) {
      onDroppedFiles(data);
      return;
    }
  };

  private widgetMounted = () => {
    this.webviewMounted = true;

    const {
      placeholder,
      defaultValue,
      contentStyle,
      isDarkMode = false,
      onEditorReady = () => null,
    } = this.props;

    if (defaultValue) {
      const formatHtml = Buffer.from(defaultValue, "utf-8").toString("base64");
      this.executeScript(InjectScriptName.SetDefaultValue, formatHtml);
    }
    if (contentStyle) {
      this.executeScript(
        InjectScriptName.SetStyle,
        JSON.stringify(contentStyle)
      );
    }
    if (placeholder) {
      this.executeScript(InjectScriptName.SetEditorPlaceholder, placeholder);
    }
    this.executeScript(InjectScriptName.SetIsDarkMode, isDarkMode.toString());

    onEditorReady();
    setTimeout(() => {
      Animated.timing(this.loadingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 200);
  };

  private onAddAtomicBlock = <T extends AtomicEntityTypes>(
    type: T,
    params: AtomicEntityProps<T>
  ) => {
    this.executeScript(
      InjectScriptName.OnAddAtomicBlock,
      JSON.stringify({ type, params })
    );
  };

  private onAddLink = (params: LinkProps) => {
    this.executeScript(InjectScriptName.OnAddLink, JSON.stringify(params));
  };

  focus = () => {
    if (!this.webviewMounted) {
      setTimeout(() => {
        this.focus();
      }, 100);
      return;
    }
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
    this.onAddAtomicBlock("IMAGE", { src });
  };

  addLink = (url: string, text: string) => {
    this.onAddLink({ url, text });
  };

  getEditorState = () => {
    return this.state.editorState;
  };

  render() {
    const { style = { flex: 1 } } = this.props;
    return (
      <>
        <WebView
          ref={this.webViewRef}
          style={style}
          containerStyle={{ flex: 0, height: "100%" }}
          source={{ uri: draftJsFilePath }}
          allowingReadAccessToURL={"file://"}
          keyboardDisplayRequiresUserAction={false}
          originWhitelist={["*"]}
          onMessage={this.onMessage}
          scrollEnabled={false}
        />
        <Animated.View
          style={{
            ...style,
            position: "absolute",
            left: 0,
            right: 0,
            top: 150,
            height: 2500,
            alignItems: "center",
            justifyContent: "center",
            opacity: this.loadingOpacity,
          }}
          pointerEvents={"none"}
        ></Animated.View>
      </>
    );
  }
}

export default RNDraftView;
