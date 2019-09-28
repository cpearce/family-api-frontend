import React, { Component } from 'react';
import { lifetimeOf } from './Utils';

const box_padding = 5;
const box_height = 80;
const box_margin = 5;
const box_width = 175;
const arrow_height = box_height;
const BLACK = "black";
const RED = "red";
const THICK = 2;
const THIN = 1;
const MAX_ZOOM = 10.0;
const MIN_ZOOM = 0.0;


function addRect(shapes, x, y, w, h, stroke, stroke_width, id) {
    shapes.boxes.push(
        {
            key: "indi-rect-" + id,
            x: x,
            y: y,
            width: w,
            height: h,
            stroke: stroke || "black",
            fill: "transparent",
            strokeWidth: stroke_width || 1,
            id: id,
        }
    );
}

function addText(shapes, x, y, w, h, text, key) {
    shapes.text.push({
        key: "text-" + key,
        x: x,
        y: y,
        width: w,
        height: h,
        text: text,
    });
}

function addIndividualBox(x, y, individual, shapes, stroke, stroke_width) {
    addRect(shapes, x, y, box_width, box_height, stroke, stroke_width, individual.id);
    const line_height = (box_height - 4 * box_padding) / 3;

    addText(shapes,
        x + box_padding,
        y + box_padding + line_height,
        box_width - 2 * box_padding,
        line_height,
        individual.last_name,
        "indi-lastname-"+individual.id);

    addText(shapes,
        x + box_padding,
        y + 2*box_padding + 2*line_height,
        box_width - 2 * box_padding,
        line_height,
        individual.first_names,
        "indi-first_names-"+individual.id);


    addText(shapes,
        x + box_padding,
        y + 3 * box_padding + 3*line_height,
        box_width - 2 * box_padding,
        line_height,
        lifetimeOf(individual),
        "text-indi-lifetime-"+individual.id);
}

function addSpouseBox(x, y, individual, shapes) {
    addIndividualBox(x, y, individual, shapes, BLACK, THIN);
}

function addDescendantBox(x, y, individual, shapes) {
    addIndividualBox(x, y, individual, shapes, RED, THICK);
}

function addLine(shapes, x1, y1, x2, y2, color, stroke_width, key) {
    shapes.lines.push(
        {
            key: key,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            stroke: color,
            strokeWidth: stroke_width,
        }
    );
}

class DescendantsLoader {

    // Throws on error.
    async load(individualId, server) {

        /*
            Maps individual id to:
            {
                individual: {
                    id: "xx",
                    first_name "xx",
                    last_name: "xx",
                    birth_date: "xx",
                    death_date: "xx"
                    families: [
                        {
                            spouse: {
                                id: "xx",
                                first_name "xx",
                                last_name: "xx",
                                birth_date: "xx",
                                death_date: "xx"
                            },
                            children: [
                                id1, id2, ...
                            ]
                        }
                    ]
                },
            }
        */
        let individuals = new Map();
        for (const d of await server.descendants(individualId)) {
            const individual = d.individual;
            individual.families = d.families;
            individuals.set(individual.id, individual);
        }

        const geometry = this.calculateGeometry(individuals, individualId);

        let shapes = {
            boxes: [],
            lines: [],
            text: [],
            links: [],
        };
        this.walkIndividual(0, 0, individualId, shapes, individuals);

        return {
            geometry: geometry,
            shapes: shapes,
            individuals: individuals,
        };
    }

    calculateGeometry(individuals, rootId) {
        let individual = individuals.get(rootId);
        // Only show spouses which produced children, as it's easier. :|
        individual.families = individual.families.filter(f => f.children.length > 0);
        let num_spouses = individual.families.length;
        let base_width =
            box_width +
            num_spouses * box_width +
            num_spouses * box_margin * 2;
        let children_width = 0;
        let children_height = 0;
        let num_children = 0;
        for (let family of individual.families) {
            num_children += family.children.length;
            for (let child of family.children) {
                let geometry = this.calculateGeometry(individuals, child);
                children_width += geometry.width;
                children_height = Math.max(children_height, geometry.height);
            }
        }
        // Account for margin between child boxes.
        children_width += box_margin * Math.max(0, num_children - 1);
        individual.width = Math.max(base_width, children_width);
        individual.base_width = base_width;
        individual.height = box_height +
            (children_height > 0 ? arrow_height + children_height : 0);
        // Offset from the start of the box to the start of the
        // first individual's box (spouse or descendant).
        individual.row_offset = (individual.width - individual.base_width) / 2;
        let f = (individual.families.length === 0) ? 0.5 : 1.5;
        individual.link_offset = individual.row_offset + f * box_width;
        return {
            width: individual.width,
            height: individual.height,
        };
    }

    walkIndividual(x, y, id, shapes, individuals) {
        let individual = individuals.get(id);
        let x_offset = individual.row_offset;

        let spouse_line_drop_offsets = [];
        let row_bottom = y + box_height;

        let lineKey = "indi-line-" + id + "-";
        let counter = 1;

        const num_families = individual.families.length;
        if (individual.families.length > 0) {
            let spouse = individual.families[0].spouse;
            addSpouseBox(x + x_offset, y, spouse, shapes);

            // Draw lines down from first spouse to connect to descendant.
            // +------+  +----------+  +------+
            // |Spouse|  |Descendant|  |Spouse|
            // +--+---+  +------+---+  +-+----+  <-- row bottom
            //    |             |        |
            //    +---+---------+--------+       <-- link bottom
            //        |
            //        +                          <-- drop bottom
            let spouse_mid_x = x + x_offset + box_width / 2;
            let descendant_mid_x = x + x_offset + box_width + box_margin + box_width / 2;
            let drop_x = x + x_offset + box_width;
            let link_bottom = row_bottom + box_height * (num_families === 1 ? 0.333 : 0.25);
            let drop_bottom = row_bottom + box_height * (num_families === 1 ? 0.66 : 0.5);

            addLine(shapes, spouse_mid_x, row_bottom, spouse_mid_x, link_bottom, BLACK, THIN, lineKey + counter++);
            addLine(shapes, spouse_mid_x, link_bottom, drop_x, link_bottom, BLACK, THIN, lineKey + counter++);
            addLine(shapes, drop_x, link_bottom, descendant_mid_x, link_bottom, RED, THICK, lineKey + counter++);
            addLine(shapes, descendant_mid_x, link_bottom, descendant_mid_x, row_bottom, RED, THICK, lineKey + counter++);
            addLine(shapes, drop_x, link_bottom, drop_x, drop_bottom, RED, THICK, lineKey + counter++);

            x_offset += box_width + box_margin;
            spouse_line_drop_offsets.push([drop_x, drop_bottom]);
        }

        addDescendantBox(x + x_offset, y, individual, shapes);

        x_offset += box_width + box_margin;

        if (individual.families.length > 1) {
            let spouse = individual.families[1].spouse;
            addSpouseBox(x + x_offset, y, spouse, shapes);

            let spouse_mid_x = x + x_offset + box_width / 2;
            let descendant_mid_x = x + x_offset - box_margin - box_width / 2;
            let drop_x = x + x_offset;
            let link_bottom = row_bottom + box_height * 0.5;
            let drop_bottom = row_bottom + box_height * 0.75;

            addLine(shapes, spouse_mid_x, row_bottom, spouse_mid_x, link_bottom, BLACK, THIN, lineKey + counter++);
            addLine(shapes, spouse_mid_x, link_bottom, drop_x, link_bottom, BLACK, THIN, lineKey + counter++);
            addLine(shapes, drop_x, link_bottom, descendant_mid_x, link_bottom, RED, THICK, lineKey + counter++);
            addLine(shapes, descendant_mid_x, link_bottom, descendant_mid_x, row_bottom, RED, THICK, lineKey + counter++);
            addLine(shapes, drop_x, link_bottom, drop_x, drop_bottom, RED, THICK, lineKey + counter++);

            spouse_line_drop_offsets.push([drop_x, drop_bottom]);
            x_offset += box_width + box_margin; // Not needed
        }

        let child_x_offset = 0;
        let child_number = 0;
        let family_number = 0;
        for (let family of individual.families) {
            if (family.children.length === 0) {
                family_number++;
                continue;
            }
            let parents_link_x = spouse_line_drop_offsets[family_number][0];
            let parents_link_y = spouse_line_drop_offsets[family_number][1];
            let min_child_link_x = x + child_x_offset +
                child_number * box_margin +
                individuals.get(family.children[0]).link_offset;
            let max_child_link_x = 0;
            for (let child_id of family.children) {
                let child_x_pos = x + child_x_offset + child_number * box_margin;
                this.walkIndividual(child_x_pos,
                    y + box_height + arrow_height,
                    child_id, shapes, individuals);

                // Line from the parent's joint line, down to the descendant child.
                let child = individuals.get(child_id);

                addLine(shapes, child_x_pos + child.link_offset, y + box_height + arrow_height,
                    child_x_pos + child.link_offset, parents_link_y, RED, THICK, lineKey + counter++);
                child_number++;
                child_x_offset += child.width;
                max_child_link_x = Math.max(max_child_link_x, child_x_pos + child.link_offset);
            }
            addLine(shapes, Math.min(min_child_link_x, parents_link_x), parents_link_y,
                Math.max(max_child_link_x, parents_link_x), parents_link_y, RED, THICK, lineKey + counter++);

            family_number++; // TODO: don't recalc this.
        }
    }
}

class AncestorsLoader {
    // Throws on error.
    async load(individualId, server) {
        let individuals = new Map();
        const data = await server.ancestors(individualId);
        for (const individual of data) {
            individuals.set(individual.id, individual);
        }

        const geometry = this.calculateGeometry(individuals, individualId);
        let shapes = {
            boxes: [],
            lines: [],
            text: [],
            links: [],
        };
        this.walkIndividual(0, 0, individualId, shapes, individuals);

        return {
            geometry: geometry,
            shapes: shapes,
            individuals: individuals,
        };
    }

    walkIndividual(x, y, id, shapes, individuals) {
        let individual = individuals.get(id);
        let child_x = x + individual.row_offset;
        addDescendantBox(child_x, y, individual, shapes);

        if (individual.parents.length === 0) {
            return;
        }
        let lineKey = "indi-line-" + id + "-";
        let counter = 1;

        let child_middle_x = child_x + box_width / 2;
        let child_bottom_y = y + box_height;
        let fork_bottom_y = child_bottom_y + arrow_height / 2;
        let parent_top_y = y + box_height + arrow_height;

        addLine(shapes, child_middle_x, child_bottom_y, child_middle_x, fork_bottom_y, BLACK, THIN, lineKey + counter++);

        let parent_x = x;
        let parent_min_link_x = x + individual.width;
        let parent_max_link_x = parent_x;
        for (let parent_id of individual.parents) {
            this.walkIndividual(parent_x, parent_top_y, parent_id, shapes, individuals);
            let parent_width = individuals.get(parent_id).width;
            let parent_middle_x = parent_x + parent_width / 2;
            addLine(shapes, parent_middle_x, fork_bottom_y, parent_middle_x, parent_top_y, BLACK, THIN, lineKey + counter++);
            parent_min_link_x = Math.min(parent_min_link_x, parent_middle_x);
            parent_max_link_x = Math.max(parent_max_link_x, parent_middle_x);
            parent_x += parent_width + box_margin;
        }
        if (parent_min_link_x < parent_max_link_x) {
            addLine(shapes, parent_min_link_x, fork_bottom_y, parent_max_link_x, fork_bottom_y, BLACK, THIN, lineKey + counter++);
        }
    }

    calculateGeometry(individuals, individualId) {

        let individual = individuals.get(individualId);
        if (!individual) {
            throw Error("Failed to find specified individual!");
        }
        let base_width = box_width;
        let parents_width = 0;
        let parents_height = 0;
        const num_parents = individual.parents.length;
        for (let parent_id of individual.parents) {
            let geometry = this.calculateGeometry(individuals, parent_id);
            parents_width += geometry.width;
            parents_height = Math.max(parents_height, geometry.height);
        }
        // Account for margin between parent boxes.
        parents_width += box_margin * Math.max(0, num_parents - 1);
        individual.width = Math.max(base_width, parents_width);
        individual.base_width = base_width;
        individual.height = box_height +
            (parents_height > 0 ? arrow_height + parents_height : 0);
        // Offset from the start of the box to the start of the
        // individual's box.
        individual.row_offset = (individual.width - individual.base_width) / 2;
        individual.link_offset = individual.width / 2;
        return {
            width: individual.width,
            height: individual.height,
        };
    }
}

class RelationalTree extends Component {
    constructor(props, loader) {
        super(props);
        this.state = {
            zoom: MAX_ZOOM,
            x: 0.5,
            y: 0.5,
        };

        this.downloadData(loader);

        this.eventHandlers = [
            { event: 'keyup', handler: this.keyUpHandler.bind(this) },
            { event: 'pointermove', handler: this.pointerMoveHandler.bind(this) },
            { event: 'pointerdown', handler: this.pointerDownHandler.bind(this) },
            { event: 'pointerup', handler: this.pointerUpHandler.bind(this) },
        ];

        this.isPointerDown = false;
    }

    componentDidMount() {
        for (const h of this.eventHandlers) {
            window.addEventListener(h.event, h.handler);
        }
    }

    componentWillUnmount() {
        for (const h of this.eventHandlers) {
            window.removeEventListener(h.event, h.handler);
        }
    }

    pointerMoveHandler(e) {
        if (!e.isPrimary || !this.isPointerDown) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        this.setState((state, props) => {
            return {
                x: Math.min(1.0, Math.max(0, state.x - (e.movementX / window.innerWidth))),
                y: Math.min(1.0, Math.max(0, state.y - (e.movementY / window.innerHeight))),
            }
        });
    }

    pointerDownHandler(e) {
        if (!e.isPrimary) {
            return;
        }
        this.isPointerDown = true;
    }

    pointerUpHandler(e) {
        if (!e.isPrimary) {
            return;
        }
        this.isPointerDown = false;
    }

    keyUpHandler(e) {
        // console.log(`keyup ${e.key}`);
        const key = e.key;
        if (key === '+' || key === '=') {
            this.setState((state, props) => {
                state.zoom = Math.max(state.zoom - 1, MIN_ZOOM);
                return state;
            });
        } else if (key === '-' || key === '_') {
            this.setState((state, props) => {
                state.zoom = Math.min(state.zoom + 1, MAX_ZOOM);
                return state;
            });
        } else if (key === 'ArrowLeft') {
            this.setState((state, props) => {
                state.x = Math.max(state.x -= 0.05, 0.0);
                return state;
            });
        } else if (key === 'ArrowRight') {
            this.setState((state, props) => {
                state.x = Math.min(state.x += 0.05, 1.0);
                return state;
            });
        } else if (key === 'ArrowUp') {
            this.setState((state, props) => {
                state.y = Math.max(state.y -= 0.05, 0.0);
                return state;
            });
        } else if (key === 'ArrowDown') {
            this.setState((state, props) => {
                state.y = Math.min(state.y += 0.05, 1.0);
                return state;
            });
        }
    }

    async downloadData(loader) {
        try {
            const data = await loader.load(this.props.individualId, this.props.server);
            this.setState(data);
        } catch (e) {
            this.props.callbacks.error(e);
        }
    }

    viewBox() {
        const w = this.state.geometry.width;
        const h = this.state.geometry.height;
        const zoom = this.state.zoom / MAX_ZOOM;
        const x = w * this.state.x - (w * zoom) / 2;
        const y = h * this.state.y - (h * zoom) / 2;
        return x + "," + y + "," + (w * zoom) + "," + (h * zoom);
    }

    render() {
        if (!this.state.shapes) {
            return (
                <div>
                    Downloading data...
                </div>
            );
        }

        const rects = this.state.shapes.boxes.map(box => {
            return (
                <rect
                    key={box.key}
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    stroke={box.stroke}
                    fill={box.fill}
                    strokeWidth={box.strokeWidth}
                    onClick={() => this.props.callbacks.detail({id: box.id})}
                    onMouseEnter={(e) => e.target.classList.add("hover")}
                    onMouseLeave={(e) => e.target.classList.remove("hover")}
                ></rect>
            );
        });

        const texts = this.state.shapes.text.map(t => {
            return (
                <text
                    key={t.key}
                    x={t.x}
                    y={t.y}
                    width={t.width}
                    height={t.height}
                >{t.text}</text>
            );
        });

        const lines = this.state.shapes.lines.map(line => {
            return (
                <line
                    key={line.key}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={line.stroke}
                    strokeWidth={line.strokeWidth}
                >
                </line>
            );
        });

        return (
            <div id="svgcontainer">
                <svg
                    viewBox={this.viewBox()}
                    width={window.innerWidth - 100}
                    height={window.innerHeight - 100}
                >
                    {rects}
                    {texts}
                    {lines}
                </svg>
            </div>

        );
    }
}

export class Descendants extends RelationalTree {
    constructor(props) {
        super(props, new DescendantsLoader());
    }
}

export class Ancestors extends RelationalTree {
    constructor(props) {
        super(props, new AncestorsLoader());
    }
}
