/**
 * Extracts all field names from a MongoDB-style filter object.
 * Ignores MongoDB operators ($and, $or, $eq, etc.)
 * Uses an iterative stack approach (no inner closures).
 */
export function extractFilterFields(filter: any): string[] {
    if (typeof filter !== 'object' || filter === null) return [];

    const fields = new Set<string>();
    const stack: any[] = [filter];

    while (stack.length > 0) {
        const node = stack.pop();
        if (typeof node !== 'object' || node === null) continue;

        for (const key in node) {
            if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
            const value = node[key];

            if (key.startsWith('$')) {
                // MongoDB operator → push nested structures
                if (Array.isArray(value)) {
                    for (let i = 0; i < value.length; i++) {
                        stack.push(value[i]);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    stack.push(value);
                }
            } else {
                // Field name → record it and walk deeper
                fields.add(key);
                if (typeof value === 'object' && value !== null) {
                    stack.push(value);
                }
            }
        }
    }

    return [...fields];
}
