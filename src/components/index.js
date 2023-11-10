import digProvider from './dig-provider.js';
import digRefresh from './dig-refresh.js';
// import docs from './docs.js';
// import invite from './invite.js';

export default [
    digProvider,
    digRefresh,
    // docs, // Don't export, as does not handle interaction requests
    // invite, // Don't export, as does not handle interaction requests
];
