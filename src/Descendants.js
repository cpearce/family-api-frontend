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

export class Descendants extends Component {
    constructor(props) {
        super(props);
        this.state = {
            zoom: MAX_ZOOM,
            x: 0.5,
            y: 0.5,
        };
        this.downloadData();
        this.keyUpHandler = this.keyUpHandler.bind(this);
    }

    componentDidMount() {
        window.addEventListener('keyup', this.keyUpHandler);
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.keyUpHandler);
    }

    keyUpHandler(e) {
        console.log(`keyup ${e.key}`);
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

    async downloadData() {
        try {
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
            for (const d of await this.props.server.descendants(this.props.individualId)) {
                const individual = d.individual;
                individual.families = d.families;
                individuals.set(individual.id, individual);
            }

            const geometry = this.calculateGeometry(individuals, this.props.individualId);

            let shapes = {
                boxes: [],
                lines: [],
                text: [],
                links: [],
            };
            this.walkIndividual(0, 0, this.props.individualId, shapes, individuals);

            this.setState({
                geometry: geometry,
                shapes: shapes,
                individuals: individuals,
            });
            console.log(`Downloaded ${individuals.size} individuals' data.`);

        } catch (e) {
            this.props.callbacks.error(e);
        }
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

    addRect(shapes, x, y, w, h, stroke, stroke_width, id) {
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

    addText(shapes, x, y, w, h, text, key) {
        shapes.text.push({
            key: "text-" + key,
            x: x,
            y: y,
            width: w,
            height: h,
            text: text,
        });
    }

    addIndividualBox(x, y, individual, shapes, stroke, stroke_width) {
        this.addRect(shapes, x, y, box_width, box_height, stroke, stroke_width, individual.id);
        const line_height = (box_height - 4 * box_padding) / 3;

        this.addText(shapes,
            x + box_padding,
            y + box_padding + line_height,
            box_width - 2 * box_padding,
            line_height,
            individual.last_name,
            "indi-lastname-"+individual.id);

        this.addText(shapes,
            x + box_padding,
            y + 2*box_padding + 2*line_height,
            box_width - 2 * box_padding,
            line_height,
            individual.first_names,
            "indi-first_names-"+individual.id);


        this.addText(shapes,
            x + box_padding,
            y + 3 * box_padding + 3*line_height,
            box_width - 2 * box_padding,
            line_height,
            lifetimeOf(individual),
            "text-indi-lifetime-"+individual.id);
    }

    addSpouseBox(x, y, individual, shapes) {
        this.addIndividualBox(x, y, individual, shapes, BLACK, THIN);
    }

    addDescendantBox(x, y, individual, shapes) {
        this.addIndividualBox(x, y, individual, shapes, RED, THICK);
    }

    addLine(shapes, x1, y1, x2, y2, color, stroke_width, key) {
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
            this.addSpouseBox(x + x_offset, y, spouse, shapes);

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

            this.addLine(shapes, spouse_mid_x, row_bottom, spouse_mid_x, link_bottom, BLACK, THIN, lineKey + counter++);
            this.addLine(shapes, spouse_mid_x, link_bottom, drop_x, link_bottom, BLACK, THIN, lineKey + counter++);
            this.addLine(shapes, drop_x, link_bottom, descendant_mid_x, link_bottom, RED, THICK, lineKey + counter++);
            this.addLine(shapes, descendant_mid_x, link_bottom, descendant_mid_x, row_bottom, RED, THICK, lineKey + counter++);
            this.addLine(shapes, drop_x, link_bottom, drop_x, drop_bottom, RED, THICK, lineKey + counter++);

            x_offset += box_width + box_margin;
            spouse_line_drop_offsets.push([drop_x, drop_bottom]);
        }

        this.addDescendantBox(x + x_offset, y, individual, shapes);

        x_offset += box_width + box_margin;

        if (individual.families.length > 1) {
            let spouse = individual.families[1].spouse;
            this.addSpouseBox(x + x_offset, y, spouse, shapes);

            let spouse_mid_x = x + x_offset + box_width / 2;
            let descendant_mid_x = x + x_offset - box_margin - box_width / 2;
            let drop_x = x + x_offset;
            let link_bottom = row_bottom + box_height * 0.5;
            let drop_bottom = row_bottom + box_height * 0.75;

            this.addLine(shapes, spouse_mid_x, row_bottom, spouse_mid_x, link_bottom, BLACK, THIN, lineKey + counter++);
            this.addLine(shapes, spouse_mid_x, link_bottom, drop_x, link_bottom, BLACK, THIN, lineKey + counter++);
            this.addLine(shapes, drop_x, link_bottom, descendant_mid_x, link_bottom, RED, THICK, lineKey + counter++);
            this.addLine(shapes, descendant_mid_x, link_bottom, descendant_mid_x, row_bottom, RED, THICK, lineKey + counter++);
            this.addLine(shapes, drop_x, link_bottom, drop_x, drop_bottom, RED, THICK, lineKey + counter++);

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

                this.addLine(shapes, child_x_pos + child.link_offset, y + box_height + arrow_height,
                    child_x_pos + child.link_offset, parents_link_y, RED, THICK, lineKey + counter++);
                child_number++;
                child_x_offset += child.width;
                max_child_link_x = Math.max(max_child_link_x, child_x_pos + child.link_offset);
            }
            this.addLine(shapes, Math.min(min_child_link_x, parents_link_x), parents_link_y,
                Math.max(max_child_link_x, parents_link_x), parents_link_y, RED, THICK, lineKey + counter++);

            family_number++; // TODO: don't recalc this.
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