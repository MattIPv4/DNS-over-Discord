const chunkStr = (str, size) => {
    const strArr = str.split('');
    let ret = [];
    // TODO: Prefer to wrap at ', ' if possible
    while (strArr.length) ret.push(strArr.splice(0, size).join(''));
    return ret;
};

module.exports.presentTable = tableRows => {
    // Generate the column data
    const columns = tableRows.reduce((count, row) => Math.max(count, row.length), 0);
    const columnPadding = idx => idx === 0 || idx === columns - 1 ? 1 : 2;

    // Define a max width for columns
    // Each column can be at maximum 2/3 of the total Discord width, minus space for dividers
    const discordWidth = 56;
    const totalWidth = discordWidth - (columns - 1);
    const columnWidth = Math.floor(totalWidth * (2 / 3));

    // Get the max width for each column
    const columnWidths = tableRows.reduce((widths, row) => {
        // Update the max width for each column
        let usedWidth = 0;
        row.forEach((val, idx) => {
            // The max width is capped at the columnWidth,
            //  and also the remaining width
            widths[idx] = Math.min(
                totalWidth - usedWidth,
                columnWidth,
                Math.max(
                    widths[idx],
                    val.length + columnPadding(idx),
                ),
            );

            // Track the used width for subsequent columns
            usedWidth += widths[idx];
        });
        return widths;
    }, Array(columns).fill(0));

    // Define the chars
    const borderVertical = '|';
    const borderHorizontal = '-';
    const borderJoin = '+';

    // Get the width & suffix for any column
    const colData = idx => ({
        width: columnWidths[idx] - columnPadding(idx),
        suffix: idx === columns - 1 ? '' : ` ${borderVertical} `,
    });

    // Build the rows
    return tableRows.map((row, rowIdx) => {
        // Wrap each column into a set of sub-rows
        const strCols = row.map((col, colIdx) => {
            // Determine the width, with padding,
            //  and if not the last col, add border + padding for this and next
            const { width, suffix } = colData(colIdx);

            // Wrap the col to the width and add the suffix to each wrapped row
            return chunkStr(col, width).map(colRow => colRow.padEnd(width, ' ') + suffix);
        });

        // Get the max sub-rows
        const maxRows = strCols.reduce((count, col) => Math.max(count, col.length), 0);

        // Combine the sub-rows
        const strRow = strCols.reduce((rows, col, colIdx) => {
            // Extend the number of rows we have in this column if needed
            if (col.length < rows.length) {
                const { width, suffix } = colData(colIdx);
                col.push(...Array(rows.length - col.length).fill(' '.repeat(width) + suffix));
            }

            // Add our column rows to the final rows
            col.forEach((row, subRowIdx) => rows[subRowIdx] += row);
            return rows;
        }, Array(maxRows).fill('')).join('\n');

        // If header row, add divider
        const divider = rowIdx === 0
            ? '\n' + columnWidths.map(size => borderHorizontal.repeat(size)).join(borderJoin)
            : '';

        // Return all the wrapped rows that form this row
        return strRow + divider;
    }).join('\n');
};
