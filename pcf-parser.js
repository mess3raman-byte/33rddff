/**
 * PCF Parser for Piping Component Files (.pcf)
 * Parses ISOGEN / Intergraph PCF text format into structured JavaScript objects.
 */

class PCFParser {
    constructor() {
        // Known keywords that mark the start of a component section
        this.componentKeywords = [
            'PIPE', 'ELBOW', 'TEE', 'FLANGE', 'VALVE', 'VALVE-OPERATOR',
            'REDUCER-CONCENTRIC', 'REDUCER-ECCENTRIC', 'SUPPORT', 'INSTRUMENT',
            'GASKET', 'BOLT', 'OLET', 'CAP', 'COUPLING', 'UNION', 'CROSS',
            'NIPPLE', 'FILTER', 'EXPANSION-JOINT', 'BEND', 'WELD', 'MISC-COMPONENT'
        ];

        // Keywords that mark attributes vs position endpoints
        this.positionKeywords = [
            'END-POINT', 'CENTRE-POINT', 'BRANCH1-POINT', 'BRANCH2-POINT',
            'CO-ORDINATES', 'TAP-POINT', 'SUPPORT-POINT'
        ];
    }

    /**
     * Parses PCF file content text into a structured object.
     * @param {string} text - PCF plain text content
     * @returns {Object} { header: {}, components: [], units: {} }
     */
    parse(text) {
        if (!text || typeof text !== 'string') {
            throw new Error("Invalid or empty PCF content.");
        }

        const lines = text.split(/\r?\n/);
        const header = {};
        const components = [];
        let currentComponent = null;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Skip empty lines or pure comments (lines starting with ! or #)
            if (!line || line.startsWith('!') || line.startsWith('#')) {
                continue;
            }

            // Standardize spaces
            const tokens = line.split(/\s+/);
            const keyword = tokens[0].toUpperCase();

            // Check if line marks the start of a new component
            if (this.componentKeywords.includes(keyword)) {
                if (currentComponent) {
                    components.push(currentComponent);
                }

                currentComponent = {
                    id: components.length + 1,
                    type: keyword,
                    endpoints: [],
                    centerPoint: null,
                    branchPoints: [],
                    attributes: {},
                    rawLines: [line]
                };
                continue;
            }

            // If we are currently inside a component definition
            if (currentComponent) {
                currentComponent.rawLines.push(line);

                if (keyword === 'END-POINT' || keyword === 'CO-ORDINATES') {
                    const ep = this.parsePointLine(tokens, line);
                    if (ep) currentComponent.endpoints.push(ep);
                } else if (keyword === 'CENTRE-POINT') {
                    const cp = this.parsePointLine(tokens, line);
                    if (cp) currentComponent.centerPoint = cp;
                } else if (keyword.startsWith('BRANCH') && keyword.endsWith('-POINT')) {
                    const bp = this.parsePointLine(tokens, line);
                    if (bp) currentComponent.branchPoints.push(bp);
                } else if (keyword === 'SUPPORT-POINT' || keyword === 'TAP-POINT') {
                    const sp = this.parsePointLine(tokens, line);
                    if (sp) currentComponent.endpoints.push(sp);
                } else {
                    // Key-value pair attribute inside component
                    const kv = this.parseKeyValue(line);
                    if (kv) {
                        currentComponent.attributes[kv.key] = kv.value;
                    }
                }
            } else {
                // We are in the header / global attributes section
                const kv = this.parseKeyValue(line);
                if (kv) {
                    // Check sub-header sections like UNITS-BORE, UNITS-CO-ORDINATES
                    header[kv.key] = kv.value;
                }
            }
        }

        // Push final component if exists
        if (currentComponent) {
            components.push(currentComponent);
        }

        // Post-process components to calculate derived geometric values (e.g., length, bore mm)
        components.forEach(comp => this.enrichComponentData(comp, header));

        return {
            header,
            components,
            summary: this.generateSummary(header, components)
        };
    }

    /**
     * Parses line containing 3D coordinate and bore info
     * Format e.g.: END-POINT 1000.00 500.00 0.00 150.00 (or 6.00)
     */
    parsePointLine(tokens, fullLine) {
        // Extract numbers from line
        const numTokens = tokens.slice(1).map(t => parseFloat(t)).filter(n => !isNaN(n));

        if (numTokens.length < 3) {
            return null;
        }

        return {
            x: numTokens[0],
            y: numTokens[1],
            z: numTokens[2],
            bore: numTokens.length >= 4 ? numTokens[3] : null
        };
    }

    /**
     * Parses key value pair from PCF line
     */
    parseKeyValue(line) {
        const firstSpaceIndex = line.search(/\s/);
        if (firstSpaceIndex === -1) {
            return { key: line.toUpperCase(), value: '' };
        }

        const key = line.substring(0, firstSpaceIndex).trim().toUpperCase();
        const value = line.substring(firstSpaceIndex).trim();
        return { key, value };
    }

    /**
     * Calculates derived properties (e.g. nominal diameter, length, orientation vectors)
     */
    enrichComponentData(comp, header) {
        // Determine primary bore
        let bore = null;
        for (const ep of comp.endpoints) {
            if (ep.bore !== null && ep.bore !== undefined) {
                bore = ep.bore;
                break;
            }
        }
        if (!bore && comp.attributes['NOMINAL-SIZE']) {
            bore = parseFloat(comp.attributes['NOMINAL-SIZE']);
        }
        comp.mainBore = bore || 100; // Default fallback if unspecified

        // Calculate length for 2-endpoint components like PIPE
        if (comp.endpoints.length >= 2) {
            const p1 = comp.endpoints[0];
            const p2 = comp.endpoints[1];
            comp.length = Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
        } else {
            comp.length = 0;
        }

        // Generate human-friendly label
        let name = comp.attributes['ITEM-DESCRIPTION'] || comp.attributes['PIPING-SPEC'] || comp.type;
        comp.displayName = `${comp.type} (${comp.mainBore}" / ${comp.mainBore > 20 ? comp.mainBore + 'mm' : comp.mainBore + 'in'})`;
    }

    /**
     * Generates pipeline metrics and metadata summary
     */
    generateSummary(header, components) {
        let totalPipeLength = 0;
        let maxBore = 0;
        let welds = 0;

        components.forEach(c => {
            if (c.type === 'PIPE') {
                totalPipeLength += c.length;
            }
            if (c.type === 'WELD') {
                welds++;
            }
            if (c.mainBore > maxBore) {
                maxBore = c.mainBore;
            }
        });

        return {
            totalComponents: components.length,
            totalPipeLength: totalPipeLength,
            maxBore: maxBore,
            weldCount: welds,
            project: header['PROJECT-NAME'] || header['PROJECT'] || 'N/A',
            pipelineRef: header['PIPELINE-REFERENCE'] || header['LINE-ID'] || header['PIPELINE'] || 'MAIN-01',
            spec: header['PIPING-SPEC'] || header['SPEC'] || 'CS150'
        };
    }
}

// Attach parser to window
window.PCFParser = PCFParser;
