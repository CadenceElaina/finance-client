import React from 'react';

/**
 * Splits a string into lines so that no line exceeds maxLineLength.
 * Returns an array of lines for use with SVG <tspan>.
 * @param {string} text - The label text to wrap.
 * @param {number} maxLineLength - Maximum characters per line.
 * @returns {string[]} Array of lines.
 */

export function wrapChartLabelLines(text, maxLineLength = 12) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    words.forEach(word => {
        if ((currentLine + ' ' + word).trim().length > maxLineLength) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        }
    });
    if (currentLine) lines.push(currentLine.trim());
    return lines;
}

/**
 * For legends or non-SVG text, returns a string with '\n' for line breaks.
 */
export function wrapChartLabel(text, maxLineLength = 12) {
    return wrapChartLabelLines(text, maxLineLength).join('\n');
}

/**
 * Helper to render SVG <tspan>s for each line.
 * @param {string[]} lines
 * @param {number} x
 * @returns {JSX.Element[]}
 */
export function renderLabelTspans(lines, x) {
    return lines.map((line, i) => (
        <tspan x={x} dy={i === 0 ? 0 : 14} key={i}>{line}</tspan>
    ));
}

/**
 * Returns a render function for recharts Pie label that wraps text and positions it.
 * Usage: label={renderPieLabel}
 */
export function renderPieLabel({ cx, cy, midAngle, outerRadius, percent, name, smallApp }) {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + (smallApp ? 6 : 10);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';
    const finalX = x + (x > cx ? 5 : -5);

    const labelText = `${name} (${(percent * 100).toFixed(0)}%)`;
    const lines = wrapChartLabelLines(labelText, 12);

    return (
        <text
            x={finalX}
            y={y - (lines.length - 1) * 8 / 2}
            fill="var(--chart-label-text)"
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize="12"
        >
            {lines.map((line, i) => (
                <tspan x={finalX} dy={i === 0 ? 0 : 14} key={i}>{line}</tspan>
            ))}
        </text>
    );
}