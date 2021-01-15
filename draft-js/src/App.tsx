import React, { createRef } from "react";
import { Editor, EditorState, RichUtils, getDefaultKeyBinding } from "draft-js";
import EdisonEditor, { onAddBlock } from "edison-editor";
import { stateFromHTML } from "draft-js-import-html";
import { stateToHTML } from "draft-js-export-html";
import Header from "./Header";
import "./styles";

type State = {
  editorState: EditorState;
  headerVisible: boolean;
  placeholder: string;
  to: Contact[];
  cc: Contact[];
  bcc: Contact[];
  from: Contact[];
  subject: string;
};

class App extends React.Component<any, State> {
  _draftEditorRef: React.RefObject<Editor>;
  constructor(props: any) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      headerVisible: false,
      placeholder: "",
      to: [],
      cc: [],
      bcc: [],
      from: [],
      subject: "",
    };
    this._draftEditorRef = createRef<Editor>();
  }

  componentDidMount() {
    this.postMessage("isMounted", true);
    window.toggleBlockType = this.toggleBlockType;
    window.toggleInlineStyle = this.toggleInlineStyle;
    window.setHeaderVisible = this.setHeaderVisible;
    window.setDefaultValue = this.setDefaultValue;
    window.setEditorPlaceholder = this.setEditorPlaceholder;
    window.setDefaultTo = this.setDefaultTo;
    window.setDefaultCc = this.setDefaultCc;
    window.setDefaultBcc = this.setDefaultBcc;
    window.setDefaultFrom = this.setDefaultFrom;
    window.setDefaultSubject = this.setDefaultSubject;
    window.onAddBlock = this.onAddBlockEntity;
    window.focusTextEditor = this.focusTextEditor;
    window.blurTextEditor = this.blurTextEditor;
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
        "editorChange",
        stateToHTML(this.state.editorState.getCurrentContent())
      );
    });
  };

  private handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.setEditorState(editorState);
      return "handled";
    }
    return "not-handled";
  };

  private mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
    const { editorState } = this.state;
    switch (e.key) {
      case "Tab":
        const newEditorState = RichUtils.onTab(
          e,
          editorState,
          4 /* maxDepth */
        );
        if (newEditorState !== editorState) {
          this.setEditorState(editorState);
        }
        return null;
      default:
        return getDefaultKeyBinding(e);
    }
  };

  private onContactChange = (
    type: "to" | "cc" | "bcc",
    contactList: Contact[]
  ) => {
    const newState = { [type]: contactList } as { to: Contact[] };
    this.setState(newState);
    this.postMessage(`${type}Change`, contactList);
  };

  private onSubjectChange = (str: string) => {
    this.setState({ subject: str });
    this.postMessage("subjectChange", str);
  };

  // publish functions

  private toggleBlockType = (blockType: string) => {
    const { editorState } = this.state;
    this.setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  private toggleInlineStyle = (inlineStyle: string) => {
    const { editorState } = this.state;
    this.setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  private setHeaderVisible = (headerVisible: string) => {
    this.setState({ headerVisible: headerVisible === true.toString() });
  };

  private setDefaultValue = (html: string) => {
    try {
      if (html) {
        this.setEditorState(EditorState.createWithContent(stateFromHTML(html)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  private setDefaultTo = (to: string) => {
    try {
      const contactList = JSON.parse(to) as Contact[];
      this.setState({ to: contactList });
    } catch (err) {
      console.error(err.message);
    }
  };

  private setDefaultCc = (cc: string) => {
    try {
      const contactList = JSON.parse(cc) as Contact[];
      this.setState({ cc: contactList });
    } catch (err) {
      console.error(err.message);
    }
  };

  private setDefaultBcc = (bcc: string) => {
    try {
      const contactList = JSON.parse(bcc) as Contact[];
      this.setState({ bcc: contactList });
    } catch (err) {
      console.error(err.message);
    }
  };

  private setDefaultFrom = (from: string) => {
    try {
      const contact = JSON.parse(from) as Contact;
      this.setState({ from: [contact] });
    } catch (err) {
      console.error(err.message);
    }
  };

  private setDefaultSubject = (subject: string) => {
    this.setState({ subject });
  };

  private setEditorPlaceholder = (placeholder: string) => {
    this.setState({ placeholder });
  };

  private onAddBlockEntity = (paramsStr: string) => {
    const { editorState } = this.state;
    try {
      const { type, params } = JSON.parse(paramsStr);
      const newState = onAddBlock(type, params, editorState);
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

  render() {
    const {
      headerVisible,
      to,
      cc,
      bcc,
      from,
      subject,
      placeholder,
      editorState,
    } = this.state;

    return (
      <>
        <style>
          {`.public-DraftEditorPlaceholder-root{position: absolute;color: silver;pointer-events: none;z-index: -10000;}`}
        </style>
        {headerVisible ? (
          <Header
            to={to}
            cc={cc}
            bcc={bcc}
            from={from}
            subject={subject}
            onToChange={(contact) => this.onContactChange("to", contact)}
            onCcChange={(contact) => this.onContactChange("cc", contact)}
            onBccChange={(contact) => this.onContactChange("bcc", contact)}
            onSubjectChange={this.onSubjectChange}
          />
        ) : null}
        <div className={"compose-editor"}>
          <EdisonEditor
            ref={this._draftEditorRef}
            editorState={editorState}
            onChange={this.setEditorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            placeholder={placeholder}
          />
        </div>
      </>
    );
  }
}

export default App;
