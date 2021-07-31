const DEFAULTS = Object.freeze({
    gain: .5,
    monitorGain: .1,
    numSamples: 256
});

/**
 * Representation of an audio graph using the Web Audio API.
 */
class AudioGraph {

    #enabled;
    #monitorEnabled;
    #ioLinked = false;

    /**
     * List of GraphParam objects representing parts of the current graph that are exposed in UI.
     */
    params;

    /**
     * @constructor
     * @param {AudioContext} ctx The AudioContext to build the graph with.
     * @param {MediaStream} stream The graph's input stream.
     * @param {Audio} outputElement Audio element to output processed audio.
     * @param {Audio} monitorElement Audio element to output monitor audio.
     * @param {boolean} enabled Whether the graph should be initially enabled.
     * @param {boolean} monitorEnabled Whether the monitor should be initially enabled.
     */
    constructor(ctx, stream, outputElement, monitorElement, enabled = true, monitorEnabled = false) {
        this.audioCtx = ctx
        this.audioStream = stream;
        this.outputElement = outputElement;
        this.monitorElement = monitorElement;
        this.#enabled = enabled;
        this.#monitorEnabled = monitorEnabled;

        this.nodes = []; // All nodes in the graph (used to clear out everything specific to one voice changer)
        this.topLevelNodes = []; // Nodes that need to be connected to the starting gainNode when "enabling"
        this.params = []; // List of GraphParam objects representing user-controllable "parameters" in the graph

        // set up the starting nodes - stream source and input volume
        this.sourceNode = this.audioCtx.createMediaStreamSource(this.audioStream);
        this.gainNode = this.audioCtx.createGain();
        // set their default values
        this.gainNode.gain.value = DEFAULTS.gain;
        // connect them
        this.sourceNode.connect(this.gainNode);

        // set up the output nodes - master, analyser, monitor gain, destinations
        this.masterNode = this.audioCtx.createGain();
        this.analyserNode = this.audioCtx.createAnalyser();
        this.destNode = this.audioCtx.createMediaStreamDestination();
        this.monitorNode = this.audioCtx.createGain();
        this.monitorDestNode = this.audioCtx.createMediaStreamDestination();
        // set their default values
        this.analyserNode.fftSize = DEFAULTS.numSamples;
        this.monitorNode.gain.value = DEFAULTS.monitorGain;
        // connect them
        // master directly connects to analyser, main dest, monitor gain
        this.masterNode.connect(this.analyserNode);
        this.masterNode.connect(this.destNode);
        this.masterNode.connect(this.monitorNode);
        // monitor gain connects to monitor dest
        this.monitorNode.connect(this.monitorDestNode);

        // Being "enabled" means that the graph expects other nodes to connect gainNode and masterNode
        // "Disabled" is just, gainNode connects to master and nothing else
        if (!this.#enabled) {
            this.gainNode.connect(this.masterNode);
        }

        // set up output element streams
        this.outputElement.srcObject = this.destNode.stream;
        this.outputElement.play();

        this.monitorElement.srcObject = this.monitorDestNode.stream;
        this.monitorElement.play();

        // hackaround
        this.toggle(true);
        this.toggleMonitor(false);
    }

    /** Gain value applied to the input stream.*/
    set inputVolume(value) {
        this.gainNode.gain.value = value;
    }
    get inputVolume() {
        return this.gainNode.gain.value;
    }

    /** Gain value applied to the monitor stream.*/
    set monitorVolume(value) {
        this.monitorNode.gain.value = value;
    }
    get monitorVolume() {
        return this.monitorNode.gain.value;
    }

    /**
     * Set the audio sink to connect to the end of the graph.
     * @param {Number} sinkId The sink ID to output to.
     */
    setOutputSink(sinkId) {
        this.outputElement.setSinkId(sinkId).then(() => {
            console.log(this.outputElement.sinkId);
        });
    }

    /**
     * Set the audio sink to connect to the monitor part of the graph.
     * @param {Number} sinkId The sink ID to output to.
     */
    setMonitorSink(sinkId) {
        this.monitorElement.setSinkId(sinkId).then(() => {
            console.log(this.monitorElement.sinkId);
        });
    }

    /**
     * Connect the graph input to its output.   
     * Hacky way to avoid registering the graph's own nodes.
     */
    linkInputAndOutput(link = true) {
        this.#ioLinked = link;
        if(this.#ioLinked) {
            this.gainNode.connect(this.masterNode);
        } else {
            this.gainNode.disconnect(this.masterNode);
        }
    }

    /**
     * Register a node or array of nodes as part of the current, temporary graph.
     * @param {AudioNode|AudioNode[]} newNodes An AudioNode or array of AudioNodes to register.
     */
    registerNodes(newNodes) {
        if (!Array.isArray(newNodes)) {
            newNodes = [newNodes];
        }
        newNodes.forEach(node => {
            if (!this.nodes.includes(node)) {
                this.nodes.push(node);
            } else {
                console.error("Node already added: " + JSON.parse(JSON.stringify(node)));
            }
        });
    }

    /**
     * Register a node or array of nodes as "top level" nodes in the current graph.   
     * Also connects the source node to the nodes passed in (and keeps track of them).
     * @param {AudioNode|AudioNode[]} newNodes An AudioNode or array of AudioNodes to register.
     * @see {@link AudioGraph#registerNodes}
     */
    registerTopLevelNodes(newNodes) {
        if (!Array.isArray(newNodes)) {
            newNodes = [newNodes];
        }

        this.registerNodes(newNodes);

        newNodes.forEach(node => {
            if (!this.topLevelNodes.includes(node)) {
                if (this.enabled) { this.gainNode.connect(node); }
                this.topLevelNodes.push(node);
            } else {
                console.error("Top level node already added: " + JSON.parse(JSON.stringify(node)));
            }
        });
    }

    // Register a node or array of nodes as "bottom level" nodes
    // Same as registerNodes, but also connects the nodes to the master output node
    /**
     * Register a node or array of nodes as "bottom level" nodes in the current graph.   
     * Also connects the nodes passed in to the master output node.
     * @param {AudioNode|AudioNode[]} newNodes An AudioNode or array of AudioNodes to register.
     * @see {@link AudioGraph#registerNodes}
     */
    registerBottomLevelNodes(newNodes) {
        if (!Array.isArray(newNodes)) {
            newNodes = [newNodes];
        }

        this.registerNodes(newNodes);

        newNodes.forEach(node => {
            node.connect(this.masterNode);
        });
    }

    /**
     * Register a GraphParam or group of GraphParams in the graph.
     * @param {GraphParam[]} newParams List of params to add.
     */
    registerParams(newParams) {
        if (!Array.isArray(newParams)) {
            newParams = [newParams];
        }
        newParams.forEach(param => {
            if (!this.params.includes(param)) {
                this.params.push(param);
            } else {
                console.error("Param already added: " + JSON.parse(JSON.stringify(param)));
            }
        });
    }

    /**
     * Toggle whether the graph is enabled.    
     * Use the `force` parameter to set a specific state.
     * @param {Boolean} [force] Whether the graph should be enabled.
     */
    toggle(force) {
        this.#enabled = force;
        if (this.#enabled) {
            this.gainNode.disconnect();
            this.topLevelNodes.forEach(node => {
                this.gainNode.connect(node);
            });
            if(this.#monitorEnabled) {
                this.masterNode.connect(this.monitorNode);
            }
            if(this.#ioLinked) {
                this.gainNode.connect(this.masterNode);
            }
        } else {
            this.gainNode.disconnect();
            this.gainNode.connect(this.masterNode);
        }
    }

    /**
     * Toggle whether the monitor output is enabled.   
     * Use the `force` parameter to set a specific state.
     * @param {Boolean} [force] Whether the monitor output should be enabled.
     */
    toggleMonitor(force) {
        this.#monitorEnabled = force;
        if (this.#monitorEnabled && this.#enabled) {
            this.masterNode.connect(this.monitorNode);
        } else {
            this.masterNode.disconnect(this.monitorNode);
        }
    }

    /**
     * Clear the current graph, keeping input and output structure intact.
     */
    clearGraph() {
        // Disconnect the gain node from all outputs
        this.gainNode.disconnect();
        // If the graph is currently disabled, reconnect it to the master output
        if (!this.#enabled) {
            this.gainNode.connect(this.masterNode);
        }

        // Disconnect all current graph nodes from all outputs
        this.nodes.forEach(node => {
            node.disconnect();
        });

        // Clear list of current nodes, top-level nodes, and params
        this.nodes = [];
        this.topLevelNodes = [];
        this.params = [];
    }
}

class GraphParam{
    /** Name of the param.   
     * Used as a title for the parameter control. */
    name;
    /** Unit label of the param (i.e. what type of thing is the user changing?).   
     * Used as a label for the parameter control. */
    unitlabel;
    /** Unit of the param (i.e. what are the units of the parameter?).   
     * Used as part of a label for the parameter control. */
    unit;
    /** @function
     * Modify function for the param.    
     * Called when setting the param, and should take a Number.    
     * @param {Number} inputValue The value from the parameter control. */
    modify;
    /** Mininum value for the param. */
    min;
    /** Maximum value for the param. */
    max;
    /** Step value for the param (how granular should the control be?). */
    step;
    /** Default value for the param. */
    defaultValue;

    /**
     * @constructor
     * @param {AudioNode} nodeRef Reference to the node that the param modifies.
     * @param {string} property Property of the param to change.
     * @param {string} name Name of the param.
     * @param {string} unitlabel Unit label for the param.
     * @param {string} unit Unit string for the param.
     * @param {Number} min Minimum value for the param.
     * @param {Number} max Maximum value for the param.
     * @param {Number} step Step value for the param.
     * @param {Number} defaultValue Default value for the param.
     * @param {function} modify Modify function. Should take and return a Number.
     */
    constructor(name, unitlabel, unit, min, max, step, defaultValue, modify) {
        this.name = name;
        this.unitlabel = unitlabel;
        this.unit = unit,
        this.min = min;
        this.max = max;
        this.step = step;
        this.defaultValue = defaultValue;
        this.modify = modify;

        this.modify(this.defaultValue);
    }
}

export { AudioGraph, GraphParam };