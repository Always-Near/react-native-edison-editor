import React, { createRef } from "react";
import { Editor, EditorState, RichUtils, getDefaultKeyBinding } from "draft-js";
import EdisonEditor, { EdisonUtil } from "edison-editor";
import { Buffer } from "buffer";
import "./styles";

const EventName = {
  IsMounted: "isMounted",
  EditorChange: "editorChange",
  ActiveStyleChange: "activeStyleChange",
  SizeChange: "sizeChange",
  EditPosition: "editPosition",
  OnFocus: "onFocus",
  OnBlur: "onBlur",
} as const;

type State = {
  editorState: EditorState;
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
    this.state = {
      editorState: EdisonUtil.htmlToState(""),
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

  private setEditorState = (editorState: EditorState) => {
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

      // only send the scroll position on events where the editor has focus
      if (selection.getHasFocus()) {
        setTimeout(() => {
          this.postMessage(EventName.SizeChange, document.body.scrollHeight);
          const currentBlockKey = selection.getStartKey();
          const currentBlockMap = editorState.getCurrentContent().getBlockMap();

          const currentBlockIndex = currentBlockMap
            .keySeq()
            .findIndex((k) => k === currentBlockKey);

          this.postMessage(
            EventName.EditPosition,
            document
              .getElementsByClassName(
                "notranslate public-DraftEditor-content"
              )[0]
              .children[0].children[currentBlockIndex].getBoundingClientRect()
              .top
          );
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
      return "handled";
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
    const { editorState } = this.state;
    this.setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  private toggleInlineStyle = (inlineStyle: string) => {
    const { editorState } = this.state;
    this.setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  private setDefaultValue = (html: string) => {
    try {
      if (html) {
        const htmlStr = Buffer.from(html, "base64").toString("utf-8");
        // clear the meta to keep style
        const reg = /<meta[^<>]*name="viewport"[^<>]*\/?>/g;
        const newState = EdisonUtil.htmlToState(htmlStr.replace(reg, ""));
        this.setEditorState(newState);
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
    const { editorState } = this.state;
    try {
      const { type, params } = JSON.parse(paramsStr);
      const newState = EdisonUtil.onAddAtomicBlock(type, params, editorState);
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
          />
        </div>
      </>
    );
  }
}

export default App;
