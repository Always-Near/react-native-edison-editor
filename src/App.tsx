import React, { createRef } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  convertToRaw,
  RawDraftContentState,
  SelectionState,
} from "draft-js";
import EdisonEditor, {
  EdisonUtil,
  EventListener,
  EventMap,
} from "edison-editor";
import { Buffer } from "buffer";
import "./styles";

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

type State = {
  editorState: EditorState;
  contentIsChange: boolean;
  placeholder: string;
  style: React.CSSProperties;
  isDarkMode: boolean;
};

const darkModeStyle = `
  :root {
    background-color: #fefefe;
    filter: invert(100%);
  }
`;

class App extends React.Component<any, State> {
  _draftEditorRef: React.RefObject<Editor>;
  constructor(props: any) {
    super(props);
    const editorState = EdisonUtil.stateFromHTML("");
    this.state = {
      editorState,
      contentIsChange: false,
      placeholder: "",
      style: {},
      isDarkMode: false,
    };
    this._draftEditorRef = createRef<Editor>();
  }

  componentDidMount() {
    this.postMessage(EventName.IsMounted, true);
    window.toggleBlockType = this.toggleBlockType;
    window.toggleInlineStyle = this.toggleInlineStyle;
    window.toggleSpecialType = this.toggleSpecialType;
    window.setDefaultValue = this.setDefaultValue;
    window.setStyle = this.setStyle;
    window.setIsDarkMode = this.setIsDarkMode;
    window.setEditorPlaceholder = this.setEditorPlaceholder;
    window.onAddAtomicBlock = this.onAddAtomicBlock;
    window.onAddLink = this.onAddLink;
    window.focusTextEditor = this.focusTextEditor;
    window.blurTextEditor = this.blurTextEditor;
    // add blur event listener
    window.onblur = () => {
      this.postMessage(EventName.OnBlur, true);
    };
    window.onfocus = () => {
      setTimeout(() => {
        this.postMessage(EventName.OnFocus, true);
        this.focusTextEditor();
      }, 200);
    };
    EventListener.addEventListener(EventMap.ImgOnload, () => {
      this.postMessage(EventName.SizeChange, document.body.scrollHeight);
    });
  }

  private postMessage = (type: string, data: any) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: type,
          data: data,
        })
      );
    }
  };

  private checkContentIsChange = () => {
    const { contentIsChange } = this.state;
    if (contentIsChange) {
      return;
    }

    this.setState({ contentIsChange: true });
    this.postMessage(EventName.ContentChange, true);
  };

  private setEditorState = (editorState: EditorState, isDefault = false) => {
    this.setState({ editorState }, () => {
      this.postMessage(
        EventName.EditorChange,
        EdisonUtil.stateToHTML(this.state.editorState)
      );

      this.postMessage(
        EventName.ActiveStyleChange,
        editorState.getCurrentInlineStyle().toArray()
      );

      const selection = editorState.getSelection();

      // only send the scroll position on events when the editor has focus
      if (selection.getHasFocus() || isDefault) {
        setTimeout(() => {
          this.postMessage(EventName.SizeChange, document.body.scrollHeight);

          // returns a value of 0 on empty lines
          const pos = window
            .getSelection()
            ?.getRangeAt(0)
            .getBoundingClientRect()?.bottom;

          if (pos) {
            this.postMessage(EventName.EditPosition, pos);
          } else if (
            window.getSelection()?.focusNode?.nodeType === Node.ELEMENT_NODE
          ) {
            // should catch new line events
            const e = window.getSelection()?.focusNode as Element;
            this.postMessage(
              EventName.EditPosition,
              e.getBoundingClientRect().bottom
            );
          }
        }, 50);
      }
    });
  };

  private onTab = (shiftKey: boolean) => {
    const { editorState } = this.state;
    if (shiftKey) {
      this.setEditorState(EdisonUtil.indentDecrease(editorState));
    } else {
      this.setEditorState(EdisonUtil.indentIncrease(editorState));
    }
  };

  private onBackSpace = (editorState: EditorState) => {
    if (EdisonUtil.isInIndentBlockBeginning(editorState)) {
      this.setEditorState(EdisonUtil.indentDecrease(editorState));
    }
    return this.onNormalCommand("backspace", editorState);
  };

  private onNormalCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  private handleKeyCommand = (command: string, editorState: EditorState) => {
    if (command === "backspace") {
      return this.onBackSpace(editorState);
    }
    return this.onNormalCommand(command, editorState);
  };

  private mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
    // on keyboard mean that content is changed
    this.checkContentIsChange();

    if (e.code === "Tab") {
      e.stopPropagation();
      e.preventDefault();
      this.onTab(e.shiftKey);
      return null;
    }
    return getDefaultKeyBinding(e);
  };

  // publish functions

  private toggleSpecialType = (command: string) => {
    // toggleSpecialType mean that content is changed
    this.checkContentIsChange();
    const { editorState } = this.state;
    if (command === "CLEAR") {
      this.setEditorState(EdisonUtil.clearAllInlineStyle(editorState));
      return;
    }
    if (command === "IndentIncrease") {
      this.setEditorState(EdisonUtil.indentIncrease(editorState));
      return;
    }
    if (command === "IndentDecrease") {
      this.setEditorState(EdisonUtil.indentDecrease(editorState));
      return;
    }
  };

  private toggleBlockType = (blockType: string) => {
    // toggleBlockType mean that content is changed
    this.checkContentIsChange();
    const { editorState } = this.state;
    this.setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  private toggleInlineStyle = (inlineStyle: string) => {
    // toggleInlineStyle mean that content is changed
    this.checkContentIsChange();
    const { editorState } = this.state;
    this.setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  private setDefaultValue = (html: string) => {
    try {
      if (html) {
        const htmlStr = Buffer.from(html, "base64").toString("utf-8");
        // clear the meta to keep style
        const reg = /<meta\s+name=(['"\s]?)viewport\1\s+content=[^>]*>/gi;
        const newState = EdisonUtil.stateFromHTML(htmlStr.replace(reg, ""));
        this.setEditorState(newState, true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  private setStyle = (style: string) => {
    try {
      const styleJson = JSON.parse(style);
      this.setState({ style: styleJson });
    } catch (err) {
      console.log(err.message);
    }
  };

  private setIsDarkMode = (isDarkMode: string) => {
    this.setState({ isDarkMode: isDarkMode === "true" });
  };

  private setEditorPlaceholder = (placeholder: string) => {
    this.setState({ placeholder });
  };

  private onAddAtomicBlock = (paramsStr: string) => {
    // onAddAtomicBlock mean that content is changed
    this.checkContentIsChange();
    const { editorState } = this.state;
    try {
      const { type, params } = JSON.parse(paramsStr);
      const newState = EdisonUtil.onAddAtomicBlock(type, params, editorState);
      this.setEditorState(newState);
    } catch (err) {
      console.log(err.message);
    }
  };

  private onAddLink = (paramsStr: string) => {
    // onAddLink mean that content is changed
    this.checkContentIsChange();
    const { editorState } = this.state;
    try {
      const { url, text } = JSON.parse(paramsStr);
      const newState = EdisonUtil.onAddLink(
        {
          url,
          text,
        },
        editorState
      );
      this.setEditorState(newState);
    } catch (err) {
      console.log(err.message);
    }
  };

  private focusTextEditor = () => {
    this._draftEditorRef.current && this._draftEditorRef.current.focus();
  };

  private blurTextEditor = () => {
    this._draftEditorRef.current && this._draftEditorRef.current.blur();
  };

  private onFocus = () => {
    this.postMessage(EventName.OnFocus, true);
  };

  private onBlur = () => {
    this.postMessage(EventName.OnBlur, true);
  };

  private readBlob = (blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = function (e) {
        resolve((e.target?.result || "") as string);
      };
      reader.readAsDataURL(blob);
    });
  };

  private onReceiveFiles = async (files: any[]) => {
    const data = [];
    for (const file of files) {
      const fileDataString = await this.readBlob(file);
      data.push({
        name: file.name,
        size: file.size,
        type: file.type,
        data: fileDataString,
      });
    }
    this.postMessage(EventName.OnPastedFiles, data);
  };

  private onReceiveLocalFiles = async (filePaths: string[]) => {
    this.postMessage(EventName.OnPastedLocalFiles, filePaths);
  };

  private onPastedFiles = (files: Blob[]) => {
    this.onReceiveFiles(files);
    return "handled" as const;
  };

  private handlePastedText = (text: string, html?: string) => {
    if (!html) {
      const urlReg =
        /^(https?|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]$/;
      if (urlReg.test(text)) {
        // pass
        return "not-handled" as const;
      } else {
        return "not-handled" as const;
      }
    }
    const imgReg = /<img[^>]+src\s*=['"\s]?(?<url>[^>]+?)['"]?\s+[^>]*>/gi;
    const paths: string[] = [];
    let res = imgReg.exec(html);
    while (res) {
      const localFilePath = res.groups?.url;
      if (localFilePath && localFilePath.startsWith("http")) {
        paths.push(localFilePath);
      }
      res = imgReg.exec(html);
    }
    if (paths.length) {
      this.onReceiveLocalFiles(paths);
    }
    return "not-handled" as const;
  };

  private onDroppedFiles = (selection: SelectionState, files: any[]) => {
    this.postMessage(
      EventName.OnDroppedFiles,
      files.map((file) => {
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          data: "",
        };
      })
    );
    return "handled" as const;
  };

  render() {
    const { placeholder, editorState, style, isDarkMode } = this.state;

    return (
      <>
        <style>{isDarkMode ? darkModeStyle : ""}</style>
        <div
          className={`compose-editor ${isDarkMode ? "dark_mode" : ""}`}
          style={style}
        >
          <EdisonEditor
            ref={this._draftEditorRef}
            editorState={editorState}
            onChange={this.setEditorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            placeholder={placeholder}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            spellCheck={true}
            autoCapitalize={"on"}
            handlePastedText={this.handlePastedText}
            handlePastedFiles={this.onPastedFiles}
            handleDroppedFiles={this.onDroppedFiles}
          />
        </div>
      </>
    );
  }
}

export default App;
