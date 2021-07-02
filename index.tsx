import React, { Component } from "react";
import { ViewStyle, Animated, Platform, TextInput } from "react-native";
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
import {
  WebViewErrorEvent,
  WebViewError,
} from "react-native-webview/lib/WebViewTypes";
import "./index.html";

export type { InlineStyleType } from "edison-editor";
export type { AtomicEntityTypes, AtomicEntityProps } from "edison-editor";

const draftJsFileTargetPath = `file://${RNFS.CachesDirectoryPath}/draftjs.html`;
let draftJsFilePath = draftJsFileTargetPath;

async function copyFileForIos() {
  const htmlPath = `file://${RNFS.MainBundlePath}/assets/node_modules/${Package.name}/index.html`;
  try {
    const fileHasExists = await RNFS.exists(draftJsFileTargetPath);
    if (fileHasExists) {
      await RNFS.unlink(draftJsFileTargetPath);
    }
    await RNFS.copyFile(htmlPath, draftJsFileTargetPath);
    return draftJsFileTargetPath;
  } catch (err) {
    // badcase remedy
    return htmlPath;
  }
}

async function copyFileForAndroid() {
  const htmlResPath = `raw/node_modules_${Package.name.replace(
    /-/g,
    ""
  )}_index.html`;
  try {
    const fileHasExists = await RNFS.exists(draftJsFileTargetPath);
    if (fileHasExists) {
      await RNFS.unlink(draftJsFileTargetPath);
    }
    await RNFS.copyFileRes(htmlResPath, draftJsFileTargetPath);
    return draftJsFileTargetPath;
  } catch (err) {
    // badcase remedy
    return `file:///android_res/${htmlResPath}`;
  }
}

async function copyFile() {
  if (Platform.OS === "ios") {
    const filePath = await copyFileForIos();
    draftJsFilePath = filePath;
  } else if (Platform.OS === "android") {
    const filePath = await copyFileForAndroid();
    draftJsFilePath = filePath;
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
  OnPastedLocalFiles: "onPastedLocalFiles",
  OnDroppedFiles: "onDroppedFiles",
} as const;

export type File = {
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
  onPastedLocalFiles?: (paths: string[]) => void;
  onDroppedFiles?: (files: File[]) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onError?: (error: WebViewError) => void;
};

type DraftViewState = {
  webviewUri: string;
  editorState: string;
  loading: boolean;
};

class RNDraftView extends Component<PropTypes, DraftViewState> {
  timeoutMap: Map<string, NodeJS.Timeout> = new Map();
  webviewMounted: boolean = false;
  private webViewRef = React.createRef<WebView>();
  private textInputRef = React.createRef<TextInput>();
  loadingOpacity = new Animated.Value(1);

  constructor(props: any) {
    super(props);
    this.state = {
      webviewUri: "",
      editorState: "",
      loading: true,
    };
  }

  componentDidMount() {
    this.setState({ webviewUri: draftJsFilePath });
  }

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
    if (
      nextProps.defaultValue &&
      nextProps.defaultValue !== this.props.defaultValue
    ) {
      const formatHtml = Buffer.from(nextProps.defaultValue, "utf-8").toString(
        "base64"
      );
      this.executeScript(InjectScriptName.SetDefaultValue, formatHtml);
    }
  };

  private doSomethingAfterMounted = (id: string, func: () => void) => {
    const timeout = this.timeoutMap.get(id);
    if (timeout) {
      clearTimeout(timeout);
    }
    if (!this.webviewMounted) {
      this.timeoutMap.set(
        id,
        setTimeout(() => {
          this.doSomethingAfterMounted(id, func);
        }, 100)
      );
      return;
    }
    func();
  };

  private executeScript = (
    functionName: typeof InjectScriptName[keyof typeof InjectScriptName],
    parameter?: string
  ) => {
    this.doSomethingAfterMounted(`executeScript-${functionName}`, () => {
      if (!this.webViewRef.current) {
        return;
      }
      this.webViewRef.current.injectJavaScript(
        `window.${functionName} && window.${functionName}(${
          parameter ? `'${parameter}'` : ""
        });true;`
      );
    });
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
      onPastedLocalFiles,
      onDroppedFiles,
    } = this.props;
    try {
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
        onPastedFiles(data as File[]);
        return;
      }
      if (type === EventName.OnPastedLocalFiles && onPastedLocalFiles) {
        onPastedLocalFiles(data as string[]);
        return;
      }
      if (type === EventName.OnDroppedFiles && onDroppedFiles) {
        onDroppedFiles(data as File[]);
        return;
      }
    } catch (err) {}
  };

  private onError = (event: WebViewErrorEvent) => {
    if (this.props.onError) {
      this.props.onError(event.nativeEvent);
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
    this.doSomethingAfterMounted(`focusAndShowKeyboard`, () => {
      // android10 has bug for requestFocus
      if (Platform.OS === "android" && Platform.Version !== 29) {
        // focus the textinput to wake up the keyborad
        this.textInputRef.current?.focus();
        // android must focus webview first
        this.webViewRef.current?.requestFocus();
      }
      this.executeScript(InjectScriptName.FocusTextEditor);
    });
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
          source={{ uri: this.state.webviewUri }}
          allowFileAccess
          allowingReadAccessToURL={"file://"}
          keyboardDisplayRequiresUserAction={false}
          originWhitelist={["*"]}
          onMessage={this.onMessage}
          contentMode={"mobile"}
          onError={this.onError}
          scrollEnabled={false}
        />
        {Platform.OS === "android" ? (
          <TextInput
            ref={this.textInputRef}
            style={{
              height: 0,
              width: 0,
              position: "absolute",
              left: -1000,
              backgroundColor: "transparent",
            }}
          />
        ) : null}
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
