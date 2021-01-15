import React from "react";

const UnicodeEmailChars =
  "\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u0250-\u02AF\u0300-\u036F\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u0530-\u058F\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u07C0-\u07FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u10A0-\u10FF\u1100-\u11FF\u1200-\u137F\u1380-\u139F\u13A0-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1900-\u194F\u1950-\u197F\u1980-\u19DF\u19E0-\u19FF\u1A00-\u1A1F\u1B00-\u1B7F\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u1E00-\u1EFF\u1F00-\u1FFF\u20D0-\u20FF\u2100-\u214F\u2C00-\u2C5F\u2C60-\u2C7F\u2C80-\u2CFF\u2D00-\u2D2F\u2D30-\u2D7F\u2D80-\u2DDF\u2F00-\u2FDF\u2FF0-\u2FFF\u3040-\u309F\u30A0-\u30FF\u3100-\u312F\u3130-\u318F\u3190-\u319F\u31C0-\u31EF\u31F0-\u31FF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uA700-\uA71F\uA800-\uA82F\uA840-\uA87F\uAC00-\uD7AF\uF900-\uFAFF";
const emailRegexTest = (email: string) => {
  const reg = new RegExp(
    `^[a-z.A-Z${UnicodeEmailChars}0-9!#$%&\\'*+\\-/=?^_\`{|}~]+@[A-Za-z${UnicodeEmailChars}0-9.-]+\\.[A-Za-z]{2,63}`,
    "g"
  );
  return reg.test(email);
};

type Props = {
  title: string;
  readOnly?: boolean;
  contactList: Contact[];
  onSugTextChange?: (text: string) => void;
  onContactChange?: (contactList: Contact[]) => void;
  icon?: React.ReactNode;
  suggestions?: ContactWithAvatar[];
};
type State = {
  selectedEmail: string;
  inputValue: string;
  focused: boolean;
};

export default class Tokenizing extends React.Component<Props, State> {
  _inputRef: React.RefObject<HTMLInputElement>;
  blurSetTimeout: number | undefined;
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedEmail: "",
      inputValue: "",
      focused: false,
    };
    this._inputRef = React.createRef<HTMLInputElement>();
  }

  private _onChangeInput = (str: string) => {
    this.setState({ inputValue: str });
    if (this.props.onSugTextChange) {
      this.props.onSugTextChange(str);
    }
  };

  private _onSubmitInput = () => {
    const { inputValue } = this.state;
    const { contactList } = this.props;
    if (!inputValue) {
      return;
    }
    const newContactList = [...contactList];
    if (contactList.every((c) => c.email !== inputValue)) {
      newContactList.push({
        name: "",
        email: inputValue,
      });
    }
    this.setState({
      inputValue: "",
    });
    if (this.props.onContactChange) {
      this.props.onContactChange(newContactList);
    }
  };

  private selectSugContact = (contact: ContactWithAvatar) => {
    const { contactList } = this.props;
    if (contactList.some((c) => c.email === contact.email)) {
      return;
    }
    this.setState({
      inputValue: "",
    });
    if (this._inputRef.current) {
      this._inputRef.current.focus();
    }
    const newContactList = [
      ...contactList,
      {
        name: contact.name,
        email: contact.email,
      },
    ];
    if (this.props.onContactChange) {
      this.props.onContactChange(newContactList);
    }
  };

  private _onInputKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && !this.state.inputValue) {
      this._deleteSelectContact();
    }
    if (event.key === "Enter") {
      this._onSubmitInput();
    }
  };

  private _onInputBlur = () => {
    setTimeout(() => {
      this._onSubmitInput();
      this.setState({
        inputValue: "",
      });
    }, 100);
    this.blurSetTimeout = setTimeout(() => {
      this.setState({
        focused: false,
      });
    }, 100);
  };

  private _onInputFocus = () => {
    if (this.blurSetTimeout) {
      clearTimeout(this.blurSetTimeout);
    }
    this.setState({
      focused: true,
    });
  };

  private _selectedContact = (email: string) => {
    this.setState({ selectedEmail: email });
    if (this._inputRef.current) {
      this._inputRef.current.focus();
    }
  };

  private _deleteSelectContact = () => {
    const { selectedEmail } = this.state;
    const { contactList } = this.props;
    const newList = contactList.filter((c) => {
      if (c.email !== selectedEmail) {
        return c;
      }
    });
    if (newList.length === contactList.length) {
      newList.pop();
    }
    this.setState({
      selectedEmail: "",
    });
    if (this.props.onContactChange) {
      this.props.onContactChange(newList);
    }
  };

  private shouldShowSuggestions = () => {
    const { focused, inputValue } = this.state;
    if (!focused || !inputValue) {
      return false;
    }
    const { readOnly, suggestions } = this.props;
    if (readOnly) {
      return false;
    }
    if (!suggestions || !this.filterSuggestions().length) {
      return false;
    }
    return true;
  };

  private filterSuggestions = () => {
    const { contactList, suggestions = [] } = this.props;
    const filter = suggestions.filter((sug) =>
      contactList.every((c) => c.email !== sug.email)
    );
    return filter;
  };

  private _renderContactItem = (contact: Contact) => {
    const { selectedEmail } = this.state;
    const isSelected = selectedEmail === contact.email;
    const emailIsInvalid = !emailRegexTest(contact.email);
    return (
      <div
        className={`tokenizing-text-contact-item ${
          isSelected ? "selected" : ""
        } ${emailIsInvalid ? "invalid" : ""}`}
        onClick={() => this._selectedContact(contact.email)}
        key={contact.email}
      >
        {contact.name || contact.email}
      </div>
    );
  };

  private _renderSuggestion = (contact: ContactWithAvatar) => {
    return (
      <div
        key={contact.email}
        className="suggestion-item"
        onClick={() => this.selectSugContact(contact)}
      >
        <div className="suggestion-item-header">
          {contact.avatar ? (
            <img src={contact.avatar} alt={contact.name} />
          ) : (
            (contact.name || contact.email).slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="suggestion-item-content">
          <div className="suggestion-item-name">{contact.name}</div>
          <div className="suggestion-item-email">{contact.email}</div>
        </div>
      </div>
    );
  };

  render() {
    const { inputValue } = this.state;
    const { title, contactList, readOnly, icon } = this.props;
    return (
      <div className="header-item-box">
        <div className="header-item-title">{title}</div>
        <div className="header-item-content">
          {contactList.map((contact) => this._renderContactItem(contact))}
          {readOnly ? null : (
            <input
              className="tokenizing-text-input"
              value={inputValue}
              ref={this._inputRef}
              onChange={(e) => this._onChangeInput(e.target.value)}
              onBlur={this._onInputBlur}
              onFocus={this._onInputFocus}
              onKeyDown={(e) => this._onInputKeyPress(e)}
            />
          )}
        </div>
        {icon ? <div className="header-item-icon">{icon}</div> : null}
        {this.shouldShowSuggestions() ? (
          <div className="header-item-suggestions">
            {this.filterSuggestions().map((sug) => this._renderSuggestion(sug))}
          </div>
        ) : null}
      </div>
    );
  }
}
