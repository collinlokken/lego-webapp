import { compose } from 'redux';
import { connect } from 'react-redux';

import { selectPodcasts } from 'app/reducers/podcasts';
import { fetchPodcasts } from 'app/actions/PodcastAction';
import prepare from 'app/utils/prepare';
import PodcastEditor from './components/PodcastEditor.js';

const mapStateToProps = (state, props) => {
  return {
    podcasts: selectPodcasts(state),
    actionGrant: state.podcasts.actionGrant
  };
};

export default compose(
  prepare((props, dispatch) => dispatch(fetchPodcasts())),
  connect(mapStateToProps, null)
)(PodcastEditor);
