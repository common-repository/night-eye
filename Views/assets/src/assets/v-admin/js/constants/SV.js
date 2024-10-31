const S = {
    NOT_EXISTS: -1,
    INT_TRUE: 1,
    INT_FALSE: 0,
};

S.Strings = {
    EMPTY: '',
    TRUE: '1',
    FALSE: '0',
    NOT_EXISTS: '-1',
    EXISTS: '-2',
    UNDEF: 'undefined',
};

S.WidgetPositions = [
    { id: 0, name: 'Bottom Left' },
    { id: 1, name: 'Top Left' },
    { id: 2, name: 'Top Right' },
    { id: 3, name: 'Bottom Right' },
];

S.PluginStatus = [
    { id: 0, name: 'Active' },
    { id: 1, name: 'Disabled' },
];

export default S;
