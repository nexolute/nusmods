import 'utils/polyfill';

import ReactDOM from 'react-dom';
import ReactModal from 'react-modal';
import _ from 'lodash';
import Raven from 'raven-js';

import configureStore from 'stores/configure-store';
import subscribeOnlineEvents from 'stores/subscribeOnlineEvents';
import initKeyboardShortcuts from 'utils/keyboardShortcuts';
import storage from 'storage';
import App from 'App';

import 'utils/sentry';
import initializeGA from 'utils/google-analytics';

import '../styles/main.scss';

const persistedState = storage.loadState();

const store = configureStore(persistedState);
store.subscribe(
  _.debounce(() => {
    const storeState = store.getState();
    // TODO: Possibly write our own utility pickNestedKeys function to
    //       pick out the keys (including nested keys) from the store
    //       that we want to persist.
    storage.saveState({
      moduleBank: {
        modules: storeState.moduleBank.modules,
        moduleList: storeState.moduleBank.moduleList,
      },
      timetables: storeState.timetables,
      theme: storeState.theme,
      settings: storeState.settings,
      // Don't persist app key as app state should be ephemeral.
    });
  }, 1000),
);

subscribeOnlineEvents(store);
initKeyboardShortcuts(store);

// Initialize ReactModal
ReactModal.setAppElement('#app');

const render = () => {
  ReactDOM.render(App({ store }), document.getElementById('app'));
};

if (module.hot) {
  module.hot.accept('App', render);
}

render();

if (process.env.NODE_ENV === 'production') {
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      Raven.captureException(e);
    });
  }
  initializeGA();
}
