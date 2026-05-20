import './textHighlight.css';

export default function TextHighlight({
    text,
    delay = 0,
    duration = 2000,
    color = '#E79839',
    textEndColor = 'inherit',
}) {
    return (
        <mark
            className="text-highlight"
            style={{
                '--highlight-color': color,
                '--highlight-duration': `${duration}ms`,
                '--highlight-delay': `${delay}ms`,
                '--highlight-text-end-color': textEndColor,
            }}
        >
            {text}
        </mark>
    );
}
