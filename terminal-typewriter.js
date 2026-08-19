function typeOutDOM(root, opts = {}) {
    const speed = opts.speed ?? 18;
    const lineDelay = opts.lineDelay ?? 400;
    const messageDelay = opts.messageDelay ?? lineDelay;
    const onDone = opts.onDone;
    const onChar = opts.onChar;
    const onLine = opts.onLine;
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        onDone && onDone();
        return { skip: () => {} };
    }
    
    const originalLines = Array.from(root.children);
    root.innerHTML = '';
    
    const ops = [];
    
    function buildTypedOps(sourceNode, parentRef) {
        const clone = sourceNode.cloneNode(false);
        ops.push({ type: 'appendEl', node: clone, parent: parentRef });
        sourceNode.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const textNode = document.createTextNode('');
                ops.push({ type: 'appendText', node: textNode, parent: clone });
                for (const ch of child.textContent) {
                    ops.push({ type: 'char', node: textNode, ch });
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                buildTypedOps(child, clone);
            }
        });
    }
    
    originalLines.forEach((lineEl, idx) => {
        const isCommand = lineEl.classList.contains('command');
        if (idx > 0) ops.push({ type: 'delay', duration: isCommand ? lineDelay : messageDelay });
        ops.push({ type: 'lineStart' });
        
        if (isCommand) {
            const lineClone = lineEl.cloneNode(false);
            ops.push({ type: 'appendEl', node: lineClone, parent: root });
            
            lineEl.childNodes.forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'P') {
                    buildTypedOps(child, lineClone);
                } else {
                    ops.push({ type: 'appendWhole', node: child.cloneNode(true), parent: lineClone });
                }
            });
        } else {
            ops.push({ type: 'appendWhole', node: lineEl.cloneNode(true), parent: root });
        }
    });
    
    let i = 0;
    let timer = null;
    let finished = false;
    
    function step() {
        if (i >= ops.length) {
            finished = true;
            onDone && onDone();
            return;
        }
        const op = ops[i++];
        switch (op.type) {
            case 'char':
            op.node.textContent += op.ch;
            onChar && onChar(op.ch);
            timer = setTimeout(step, speed);
            break;
            case 'delay':
            timer = setTimeout(step, op.duration);
            break;
            case 'lineStart':
            onLine && onLine();
            step();
            break;
            default:
            op.parent.appendChild(op.node);
            step();
            break;
        }
    }
    step();
    
    return {
        skip() {
            if (finished) return;
            clearTimeout(timer);
            ops.slice(i).forEach(op => {
                if (op.type === 'char') op.node.textContent += op.ch;
                else if (op.type === 'delay' || op.type === 'lineStart') return;
                else op.parent.appendChild(op.node);
            });
            finished = true;
            onDone && onDone();
        }
    };
}