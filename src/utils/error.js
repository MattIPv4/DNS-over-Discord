export const contextualThrow = (err, context) => {
    // Add our context
    err.context = { ...(err.context || {}), ...context };

    // Throw
    throw err;
};

export const captureException = (err, sentry, log = true) => {
    const context = err.context || {};

    // Log the error
    if (log) console.error(err, JSON.stringify({ context }, null, 2));

    // Capture the error
    sentry.withScope(scope => {
        Object.entries(context).forEach(([ key, value ]) => {
            scope.setExtra(key, value);
        });
        sentry.captureException(err);
    });
};
