export const optSignature = opt =>
    `${opt.required ? '<' : '['}${opt.name}${opt.required ? '>' : ']'}`;

export const cmdSignature = cmd =>
    `/${cmd.name} ${(cmd.options || []).map(optSignature).join(' ')}`.trim();

const optExplainer = opt =>
    `${optSignature(opt)}:\n  ${opt.description}\n\n  ${(opt.help || '').replace(/\n/g, '\n  ')}`.trim();

const optsExplainer = opts =>
    (opts || []).map(optExplainer).join('\n\n').trim();

export const cmdExplainer = cmd =>
    `${cmdSignature(cmd)}\n\n${cmd.description}\n\n${optsExplainer(cmd.options)}`.trim();
