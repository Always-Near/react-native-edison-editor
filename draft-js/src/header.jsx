import React from "react";

export default class Header extends React.Component {
  constructor() {
    super();
    this.state = {
      toValue: "",
      ccValue: "",
      bccValue: "",
    };
  }

  _onContactInputChange = (value, type) => {
    const newState = {
      [`${type}Value`]: value,
    };
    this.setState(newState);
  };

  _onContactInputEndEditing = (value, type) => {
    if (!value) {
      return;
    }
    const newState = {
      [`${type}Value`]: "",
    };
    this.setState(newState);
    const {
      onToChange,
      onCcChange,
      onBccChange,
      to,
      cc,
      bcc,
      account,
    } = this.props;
    const contact = this.autoCompleteContact(value);
    const addContact = contact || {
      accountId: account?.id || "",
      name: value,
      email: value,
    };
    switch (type) {
      case ContactInputType.To:
        onToChange([...to, addContact]);
        break;
      case ContactInputType.Cc:
        onCcChange([...cc, addContact]);
        break;
      case ContactInputType.Bcc:
        onBccChange([...bcc, addContact]);
        break;
    }
  };

  _onSubjectEndEditing = (str) => {
    const { onSubjectChange } = this.props;
    onSubjectChange(str);
  };

  render() {
    const { toValue, ccValue, bccValue } = this.state;
    const { to, cc, bcc, subject } = this.props;
    return <div>test</div>;
  }
}
