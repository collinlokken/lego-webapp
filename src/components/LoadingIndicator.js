import React from 'react';

var LoadingIndicator = React.createClass({

  getDefaultProps() {
    return {
      loading: false
    };
  },

  render() {
    if (this.props.loading) {
      return (
        <div className='spinner'>
          <div className='double-bounce1'></div>
          <div className='double-bounce2'></div>
        </div>
      );
    }
    return this.props.children;
  }
});

export default LoadingIndicator;
