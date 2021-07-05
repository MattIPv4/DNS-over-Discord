const MessageComponentType = {};
MessageComponentType[MessageComponentType['ACTION_ROW'] = 1] = 'ACTION_ROW';
MessageComponentType[MessageComponentType['BUTTON'] = 2] = 'BUTTON';
MessageComponentType[MessageComponentType['SELECT_MENU'] = 3] = 'SELECT_MENU';

const MessageComponentButtonStyle = {};
MessageComponentButtonStyle[MessageComponentButtonStyle['PRIMARY'] = 1] = 'PRIMARY';
MessageComponentButtonStyle[MessageComponentButtonStyle['SECONDARY'] = 2] = 'SECONDARY';
MessageComponentButtonStyle[MessageComponentButtonStyle['SUCCESS'] = 3] = 'SUCCESS';
MessageComponentButtonStyle[MessageComponentButtonStyle['DANGER'] = 4] = 'DANGER';
MessageComponentButtonStyle[MessageComponentButtonStyle['LINK'] = 5] = 'LINK';

module.exports = {
    MessageComponentType,
    MessageComponentButtonStyle,
};
