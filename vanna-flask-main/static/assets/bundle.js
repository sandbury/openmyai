(function (l, r) {
    if (!l || l.getElementById('livereloadscript')) return;
    r = l.createElement('script');
    r.async = 1;
    r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1';
    r.id = 'livereloadscript';
    l.getElementsByTagName('head')[0].appendChild(r)
})(self.document);
var app = (function () {
    'use strict';

    /** @returns {void} */
    function noop() {
    }

    /** @returns {void} */
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: {file, line, column, char}
        };
    }

    function run(fn) {
        return fn();
    }

    function blank_object() {
        return Object.create(null);
    }

    /**
     * @param {Function[]} fns
     * @returns {void}
     */
    function run_all(fns) {
        fns.forEach(run);
    }

    /**
     * @param {any} thing
     * @returns {thing is Function}
     */
    function is_function(thing) {
        return typeof thing === 'function';
    }

    /** @returns {boolean} */
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
    }

    let src_url_equal_anchor;

    /**
     * @param {string} element_src
     * @param {string} url
     * @returns {boolean}
     */
    function src_url_equal(element_src, url) {
        if (element_src === url) return true;
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        // This is actually faster than doing URL(..).href
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }

    /** @returns {boolean} */
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    /** @type {typeof globalThis} */
    const globals =
        typeof window !== 'undefined'
            ? window
            : typeof globalThis !== 'undefined'
            ? globalThis
            : // @ts-ignore Node typings have this
            global;

    /**
     * @param {Node} target
     * @param {Node} node
     * @returns {void}
     */
    function append(target, node) {
        target.appendChild(node);
    }

    /**
     * @param {Node} target
     * @param {Node} node
     * @param {Node} [anchor]
     * @returns {void}
     */
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }

    /**
     * @param {Node} node
     * @returns {void}
     */
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }

    /**
     * @returns {void} */
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i]) iterations[i].d(detaching);
        }
    }

    /**
     * @template {keyof HTMLElementTagNameMap} K
     * @param {K} name
     * @returns {HTMLElementTagNameMap[K]}
     */
    function element(name) {
        return document.createElement(name);
    }

    /**
     * @template {keyof SVGElementTagNameMap} K
     * @param {K} name
     * @returns {SVGElement}
     */
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    /**
     * @param {string} data
     * @returns {Text}
     */
    function text(data) {
        return document.createTextNode(data);
    }

    /**
     * @returns {Text} */
    function space() {
        return text(' ');
    }

    /**
     * @returns {Text} */
    function empty() {
        return text('');
    }

    /**
     * @param {EventTarget} node
     * @param {string} event
     * @param {EventListenerOrEventListenerObject} handler
     * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
     * @returns {() => void}
     */
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }

    /**
     * @param {Element} node
     * @param {string} attribute
     * @param {string} [value]
     * @returns {void}
     */
    function attr(node, attribute, value) {
        if (value == null) node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
    }

    /**
     * @param {Element} element
     * @returns {ChildNode[]}
     */
    function children(element) {
        return Array.from(element.childNodes);
    }

    /**
     * @returns {void} */
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }

    /**
     * @returns {void} */
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        } else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }

    /**
     * @template T
     * @param {string} type
     * @param {T} [detail]
     * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
     * @returns {CustomEvent<T>}
     */
    function custom_event(type, detail, {bubbles = false, cancelable = false} = {}) {
        return new CustomEvent(type, {detail, bubbles, cancelable});
    }

    /**
     * @typedef {Node & {
     * 	claim_order?: number;
     * 	hydrate_init?: true;
     * 	actual_end_child?: NodeEx;
     * 	childNodes: NodeListOf<NodeEx>;
     * }} NodeEx
     */

    /** @typedef {ChildNode & NodeEx} ChildNodeEx */

    /** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

    /**
     * @typedef {ChildNodeEx[] & {
     * 	claim_info?: {
     * 		last_index: number;
     * 		total_claimed: number;
     * 	};
     * }} ChildNodeArray
     */

    let current_component;

    /** @returns {void} */
    function set_current_component(component) {
        current_component = component;
    }

    function get_current_component() {
        if (!current_component) throw new Error('Function called outside component initialization');
        return current_component;
    }

    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
     *
     * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs/svelte#onmount
     * @template T
     * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
     * @returns {void}
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     *
     * https://svelte.dev/docs/svelte#afterupdate
     * @param {() => any} fn
     * @returns {void}
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];

    let render_callbacks = [];

    const flush_callbacks = [];

    const resolved_promise = /* @__PURE__ */ Promise.resolve();

    let update_scheduled = false;

    /** @returns {void} */
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }

    /** @returns {Promise<void>} */
    function tick() {
        schedule_update();
        return resolved_promise;
    }

    /** @returns {void} */
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }

    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();

    let flushidx = 0; // Do *not* move this inside the flush() function

    /** @returns {void} */
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            } catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length) binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }

    /** @returns {void} */
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     * @param {Function[]} fns
     * @returns {void}
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    const outroing = new Set();

    /**
     * @param {import('./private.js').Fragment} block
     * @param {0 | 1} [local]
     * @returns {void}
     */
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    /** @typedef {1} INTRO */
    /** @typedef {0} OUTRO */
    /** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
    /** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

    /**
     * @typedef {Object} Outro
     * @property {number} r
     * @property {Function[]} c
     * @property {Object} p
     */

    /**
     * @typedef {Object} PendingProgram
     * @property {number} start
     * @property {INTRO|OUTRO} b
     * @property {Outro} [group]
     */

    /**
     * @typedef {Object} Program
     * @property {number} a
     * @property {INTRO|OUTRO} b
     * @property {1|-1} d
     * @property {number} duration
     * @property {number} start
     * @property {number} end
     * @property {Outro} [group]
     */

    // general each functions:

    function ensure_array_like(array_like_or_iterator) {
        return array_like_or_iterator?.length !== undefined
            ? array_like_or_iterator
            : Array.from(array_like_or_iterator);
    }

    // keyed each functions:

    /** @returns {void} */
    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }

    /** @returns {any[]} */
    function update_keyed_each(
        old_blocks,
        dirty,
        get_key,
        dynamic,
        ctx,
        list,
        lookup,
        node,
        destroy,
        create_each_block,
        next,
        get_context
    ) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--) old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            } else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, (new_blocks[i] = block));
            if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();

        /** @returns {void} */
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }

        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            } else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            } else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            } else if (did_move.has(old_key)) {
                o--;
            } else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            } else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
        }
        while (n) insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }

    /** @returns {void} */
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Map();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                let value = '';
                try {
                    value = `with value '${String(key)}' `;
                } catch (e) {
                    // can't stringify
                }
                throw new Error(
                    `Cannot have duplicate keys in a keyed each: Keys at index ${keys.get(
                        key
                    )} and ${i} ${value}are duplicates`
                );
            }
            keys.set(key, i);
        }
    }

    /** @returns {void} */
    function mount_component(component, target, anchor) {
        const {fragment, after_update} = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
            // if the component was destroyed immediately
            // it will update the `$$.on_destroy` reference to `null`.
            // the destructured on_destroy may still reference to the old array
            if (component.$$.on_destroy) {
                component.$$.on_destroy.push(...new_on_destroy);
            } else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }

    /** @returns {void} */
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }

    /** @returns {void} */
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
    }

    // TODO: Document the other params
    /**
     * @param {SvelteComponent} component
     * @param {import('./public.js').ComponentConstructorOptions} options
     *
     * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
     * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
     * This will be the `add_css` function from the compiled component.
     *
     * @returns {void}
     */
    function init(
        component,
        options,
        instance,
        create_fragment,
        not_equal,
        props,
        append_styles = null,
        dirty = [-1]
    ) {
        const parent_component = current_component;
        set_current_component(component);
        /** @type {import('./private.js').T$$} */
        const $$ = (component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        });
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
                    if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
                    if (ready) make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // TODO: what is the correct type here?
                // @ts-expect-error
                const nodes = children(options.target);
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro) transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }

    /**
     * Base class for Svelte components. Used when dev=false.
     *
     * @template {Record<string, any>} [Props=any]
     * @template {Record<string, any>} [Events=any]
     */
    class SvelteComponent {
        /**
         * ### PRIVATE API
         *
         * Do not use, may change at any time
         *
         * @type {any}
         */
        $$ = undefined;
        /**
         * ### PRIVATE API
         *
         * Do not use, may change at any time
         *
         * @type {any}
         */
        $$set = undefined;

        /** @returns {void} */
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }

        /**
         * @template {Extract<keyof Events, string>} K
         * @param {K} type
         * @param {((e: Events[K]) => void) | null | undefined} callback
         * @returns {() => void}
         */
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1) callbacks.splice(index, 1);
            };
        }

        /**
         * @param {Partial<Props>} props
         * @returns {void}
         */
        $set(props) {
            if (this.$$set && !is_empty(props)) {
                this.$$.skip_bound = true;
                this.$$set(props);
                this.$$.skip_bound = false;
            }
        }
    }

    /**
     * @typedef {Object} CustomElementPropDefinition
     * @property {string} [attribute]
     * @property {boolean} [reflect]
     * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
     */

    // generated during release, do not modify

    /**
     * The current version, as set in package.json.
     *
     * https://svelte.dev/docs/svelte-compiler#svelte-version
     * @type {string}
     */
    const VERSION = '4.2.19';
    const PUBLIC_VERSION = '4';

    /**
     * @template T
     * @param {string} type
     * @param {T} [detail]
     * @returns {void}
     */
    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, {version: VERSION, ...detail}, {bubbles: true}));
    }

    /**
     * @param {Node} target
     * @param {Node} node
     * @returns {void}
     */
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', {target, node});
        append(target, node);
    }

    /**
     * @param {Node} target
     * @param {Node} node
     * @param {Node} [anchor]
     * @returns {void}
     */
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', {target, node, anchor});
        insert(target, node, anchor);
    }

    /**
     * @param {Node} node
     * @returns {void}
     */
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', {node});
        detach(node);
    }

    /**
     * @param {Node} node
     * @param {string} event
     * @param {EventListenerOrEventListenerObject} handler
     * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
     * @param {boolean} [has_prevent_default]
     * @param {boolean} [has_stop_propagation]
     * @param {boolean} [has_stop_immediate_propagation]
     * @returns {() => void}
     */
    function listen_dev(
        node,
        event,
        handler,
        options,
        has_prevent_default,
        has_stop_propagation,
        has_stop_immediate_propagation
    ) {
        const modifiers =
            options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default) modifiers.push('preventDefault');
        if (has_stop_propagation) modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', {node, event, handler, modifiers});
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', {node, event, handler, modifiers});
            dispose();
        };
    }

    /**
     * @param {Element} node
     * @param {string} attribute
     * @param {string} [value]
     * @returns {void}
     */
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', {node, attribute});
        else dispatch_dev('SvelteDOMSetAttribute', {node, attribute, value});
    }

    /**
     * @param {Text} text
     * @param {unknown} data
     * @returns {void}
     */
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data) return;
        dispatch_dev('SvelteDOMSetData', {node: text, data});
        text.data = /** @type {string} */ (data);
    }

    function ensure_array_like_dev(arg) {
        if (
            typeof arg !== 'string' &&
            !(arg && typeof arg === 'object' && 'length' in arg) &&
            !(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
        ) {
            throw new Error('{#each} only works with iterable values.');
        }
        return ensure_array_like(arg);
    }

    /**
     * @returns {void} */
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }

    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     *
     * Can be used to create strongly typed Svelte components.
     *
     * #### Example:
     *
     * You have component library on npm called `component-library`, from which
     * you export a component called `MyComponent`. For Svelte+TypeScript users,
     * you want to provide typings. Therefore you create a `index.d.ts`:
     * ```ts
     * import { SvelteComponent } from "svelte";
     * export class MyComponent extends SvelteComponent<{foo: string}> {}
     * ```
     * Typing this makes it possible for IDEs like VS Code with the Svelte extension
     * to provide intellisense and to use the component like this in a Svelte file
     * with TypeScript:
     * ```svelte
     * <script lang="ts">
     *    import { MyComponent } from "component-library";
     * </script>
     * <MyComponent foo={'bar'} />
     * ```
     * @template {Record<string, any>} [Props=any]
     * @template {Record<string, any>} [Events=any]
     * @template {Record<string, any>} [Slots=any]
     * @extends {SvelteComponent<Props, Events>}
     */
    class SvelteComponentDev extends SvelteComponent {
        /**
         * For type checking capabilities only.
         * Does not exist at runtime.
         * ### DO NOT USE!
         *
         * @type {Props}
         */
        $$prop_def;
        /**
         * For type checking capabilities only.
         * Does not exist at runtime.
         * ### DO NOT USE!
         *
         * @type {Events}
         */
        $$events_def;
        /**
         * For type checking capabilities only.
         * Does not exist at runtime.
         * ### DO NOT USE!
         *
         * @type {Slots}
         */
        $$slot_def;

        /** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }

        /** @returns {void} */
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }

        /** @returns {void} */
        $capture_state() {
        }

        /** @returns {void} */
        $inject_state() {
        }
    }

    if (typeof window !== 'undefined')
        // @ts-ignore
        (window.__svelte || (window.__svelte = {v: new Set()})).v.add(PUBLIC_VERSION);

    /* src\App.svelte generated by Svelte v4.2.19 */

    const {Object: Object_1, console: console_1} = globals;
    const file = "src\\App.svelte";

    function get_each_context_2(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[55] = list[i];
        child_ctx[56] = list;
        child_ctx[57] = i;
        return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[58] = list[i];
        return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[11] = list[i];
        return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[11] = list[i];
        return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[52] = list[i];
        return child_ctx;
    }

    function get_each_context(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[49] = list[i];
        return child_ctx;
    }

    // (472:24) {#if showConfirm}
    function create_if_block_9(ctx) {
        let p;
        let t1;
        let div;
        let button0;
        let t3;
        let button1;
        let mounted;
        let dispose;

        const block = {
            c: function create() {
                p = element("p");
                p.textContent = "确认生成报告？";
                t1 = space();
                div = element("div");
                button0 = element("button");
                button0.textContent = "确定";
                t3 = space();
                button1 = element("button");
                button1.textContent = "取消";
                attr_dev(p, "class", "text-center text-lg mb-4 svelte-1uf8i0p");
                add_location(p, file, 474, 28, 19615);
                attr_dev(button0, "class", "px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition duration-200 svelte-1uf8i0p");
                add_location(button0, file, 478, 28, 19817);
                attr_dev(button1, "class", "px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition duration-200 svelte-1uf8i0p");
                add_location(button1, file, 483, 28, 20098);
                attr_dev(div, "class", "flex justify-center gap-x-1 w-full svelte-1uf8i0p");
                add_location(div, file, 477, 24, 19740);
            },
            m: function mount(target, anchor) {
                insert_dev(target, p, anchor);
                insert_dev(target, t1, anchor);
                insert_dev(target, div, anchor);
                append_dev(div, button0);
                append_dev(div, t3);
                append_dev(div, button1);

                if (!mounted) {
                    dispose = [
                        listen_dev(button0, "click", /*generateReport*/ ctx[23], false, false, false, false),
                        listen_dev(button1, "click", /*cancelReport*/ ctx[20], false, false, false, false)
                    ];

                    mounted = true;
                }
            },
            p: noop,
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(p);
                    detach_dev(t1);
                    detach_dev(div);
                }

                mounted = false;
                run_all(dispose);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_9.name,
            type: "if",
            source: "(472:24) {#if showConfirm}",
            ctx
        });

        return block;
    }

    // (501:24) {#if showConfirm_ppt}
    function create_if_block_8(ctx) {
        let p;
        let t1;
        let div;
        let button0;
        let t3;
        let button1;
        let mounted;
        let dispose;

        const block = {
            c: function create() {
                p = element("p");
                p.textContent = "确认生成PPT？";
                t1 = space();
                div = element("div");
                button0 = element("button");
                button0.textContent = "确定";
                t3 = space();
                button1 = element("button");
                button1.textContent = "取消";
                attr_dev(p, "class", "text-center text-lg mb-4 svelte-1uf8i0p");
                add_location(p, file, 503, 28, 21458);
                attr_dev(button0, "class", "px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition duration-200 svelte-1uf8i0p");
                add_location(button0, file, 507, 32, 21669);
                attr_dev(button1, "class", "px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition duration-200 svelte-1uf8i0p");
                add_location(button1, file, 512, 32, 21963);
                attr_dev(div, "class", "flex justify-center gap-x-1 w-full svelte-1uf8i0p");
                add_location(div, file, 506, 28, 21588);
            },
            m: function mount(target, anchor) {
                insert_dev(target, p, anchor);
                insert_dev(target, t1, anchor);
                insert_dev(target, div, anchor);
                append_dev(div, button0);
                append_dev(div, t3);
                append_dev(div, button1);

                if (!mounted) {
                    dispose = [
                        listen_dev(button0, "click", /*generatePPT*/ ctx[24], false, false, false, false),
                        listen_dev(button1, "click", /*cancelReport_ppt*/ ctx[22], false, false, false, false)
                    ];

                    mounted = true;
                }
            },
            p: noop,
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(p);
                    detach_dev(t1);
                    detach_dev(div);
                }

                mounted = false;
                run_all(dispose);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_8.name,
            type: "if",
            source: "(501:24) {#if showConfirm_ppt}",
            ctx
        });

        return block;
    }

    // (689:4) {:else}
    function create_else_block(ctx) {
        let div7;
        let div1;
        let div0;
        let h1;
        let t1;
        let p;
        let t3;
        let t4;
        let footer;
        let div6;
        let input;
        let t5;
        let div5;
        let div4;
        let div2;
        let t6;
        let div3;
        let button0;
        let svg0;
        let path0;
        let path1;
        let line;
        let t7;
        let button1;
        let svg1;
        let path2;
        let mounted;
        let dispose;

        function select_block_type_1(ctx, dirty) {
            if (/*talk*/ ctx[4] === false) return create_if_block_1;
            return create_else_block_1;
        }

        let current_block_type = select_block_type_1(ctx);
        let if_block = current_block_type(ctx);

        const block = {
            c: function create() {
                div7 = element("div");
                div1 = element("div");
                div0 = element("div");
                h1 = element("h1");
                h1.textContent = "欢迎使用财务AI系统";
                t1 = space();
                p = element("p");
                p.textContent = "一个数据库助手";
                t3 = space();
                if_block.c();
                t4 = space();
                footer = element("footer");
                div6 = element("div");
                input = element("input");
                t5 = space();
                div5 = element("div");
                div4 = element("div");
                div2 = element("div");
                t6 = space();
                div3 = element("div");
                button0 = element("button");
                svg0 = svg_element("svg");
                path0 = svg_element("path");
                path1 = svg_element("path");
                line = svg_element("line");
                t7 = space();
                button1 = element("button");
                svg1 = svg_element("svg");
                path2 = svg_element("path");
                attr_dev(h1, "class", "text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white svelte-1uf8i0p");
                add_location(h1, file, 691, 80, 36579);
                attr_dev(p, "class", "mt-3 text-gray-600 dark:text-gray-400 svelte-1uf8i0p");
                add_location(p, file, 693, 20, 36712);
                attr_dev(div0, "class", "max-w-4xl px-4 sm:px-6 lg:px-8 mx-auto text-center svelte-1uf8i0p");
                add_location(div0, file, 691, 16, 36515);
                attr_dev(div1, "class", "py-10 lg:py-14 svelte-1uf8i0p");
                add_location(div1, file, 690, 12, 36470);
                attr_dev(input, "type", "text");
                attr_dev(input, "class", "p-4 pb-12 block w-full bg-gray-100 border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 dark:border-gray-700 dark:text-gray-400 svelte-1uf8i0p");
                attr_dev(input, "placeholder", "向我询问有关您的数据的问题，我可以将其转换为 SQL。");
                add_location(input, file, 852, 39, 49652);
                attr_dev(div2, "class", "flex items-center svelte-1uf8i0p");
                add_location(div2, file, 859, 28, 50342);
                attr_dev(path0, "d", "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z");
                attr_dev(path0, "class", "svelte-1uf8i0p");
                add_location(path0, file, 866, 40, 51213);
                attr_dev(path1, "d", "M19 10v2a7 7 0 0 1-14 0v-2");
                attr_dev(path1, "class", "svelte-1uf8i0p");
                add_location(path1, file, 867, 40, 51324);
                attr_dev(line, "x1", "12");
                attr_dev(line, "x2", "12");
                attr_dev(line, "y1", "19");
                attr_dev(line, "y2", "22");
                attr_dev(line, "class", "svelte-1uf8i0p");
                add_location(line, file, 868, 40, 51409);
                attr_dev(svg0, "class", "flex-shrink-0 size-4 svelte-1uf8i0p");
                attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg0, "width", "24");
                attr_dev(svg0, "height", "24");
                attr_dev(svg0, "viewBox", "0 0 24 24");
                attr_dev(svg0, "fill", "none");
                attr_dev(svg0, "stroke", "currentColor");
                attr_dev(svg0, "stroke-width", "2");
                attr_dev(svg0, "stroke-linecap", "round");
                attr_dev(svg0, "stroke-linejoin", "round");
                add_location(svg0, file, 865, 36, 50962);
                attr_dev(button0, "type", "button");
                attr_dev(button0, "class", "inline-flex flex-shrink-0 justify-center items-center size-8 rounded-lg text-gray-500 hover:text-blue-600 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-blue-500 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 svelte-1uf8i0p");
                add_location(button0, file, 861, 32, 50480);
                attr_dev(path2, "d", "M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z");
                attr_dev(path2, "class", "svelte-1uf8i0p");
                add_location(path2, file, 877, 40, 52186);
                attr_dev(svg1, "class", "h-3.5 w-3.5 svelte-1uf8i0p");
                attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg1, "width", "16");
                attr_dev(svg1, "height", "16");
                attr_dev(svg1, "fill", "currentColor");
                attr_dev(svg1, "viewBox", "0 0 16 16");
                add_location(svg1, file, 874, 36, 51940);
                attr_dev(button1, "type", "button");
                attr_dev(button1, "class", "inline-flex flex-shrink-0 justify-center items-center h-8 w-8 rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all svelte-1uf8i0p");
                add_location(button1, file, 871, 32, 51572);
                attr_dev(div3, "class", "flex items-center gap-x-1 svelte-1uf8i0p");
                add_location(div3, file, 860, 28, 50408);
                attr_dev(div4, "class", "flex justify-between items-center svelte-1uf8i0p");
                add_location(div4, file, 858, 24, 50266);
                attr_dev(div5, "class", "absolute bottom-px inset-x-px p-2 rounded-b-md bg-gray-100 dark:bg-slate-800 svelte-1uf8i0p");
                add_location(div5, file, 857, 20, 50150);
                attr_dev(div6, "class", "relative  svelte-1uf8i0p");
                add_location(div6, file, 852, 16, 49629);
                attr_dev(footer, "class", "max-w-4xl mx-auto sticky bottom-0 z-10 p-3 sm:py-6 svelte-1uf8i0p");
                add_location(footer, file, 850, 12, 49544);
                attr_dev(div7, "id", "chat-container");
                attr_dev(div7, "class", "relative w-full lg:pl-64 svelte-1uf8i0p");
                add_location(div7, file, 689, 8, 36398);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div7, anchor);
                append_dev(div7, div1);
                append_dev(div1, div0);
                append_dev(div0, h1);
                append_dev(div0, t1);
                append_dev(div0, p);
                append_dev(div1, t3);
                if_block.m(div1, null);
                append_dev(div7, t4);
                append_dev(div7, footer);
                append_dev(footer, div6);
                append_dev(div6, input);
                set_input_value(input, /*questionInput*/ ctx[7]);
                append_dev(div6, t5);
                append_dev(div6, div5);
                append_dev(div5, div4);
                append_dev(div4, div2);
                append_dev(div4, t6);
                append_dev(div4, div3);
                append_dev(div3, button0);
                append_dev(button0, svg0);
                append_dev(svg0, path0);
                append_dev(svg0, path1);
                append_dev(svg0, line);
                append_dev(div3, t7);
                append_dev(div3, button1);
                append_dev(button1, svg1);
                append_dev(svg1, path2);

                if (!mounted) {
                    dispose = [
                        listen_dev(input, "input", /*input_input_handler*/ ctx[32]),
                        listen_dev(input, "keydown", /*handleKeyDown*/ ctx[18], false, false, false, false),
                        listen_dev(button0, "click", /*startSpeechRecognition*/ ctx[16], false, false, false, false),
                        listen_dev(button1, "click", /*handleGenerateSQL*/ ctx[17], false, false, false, false)
                    ];

                    mounted = true;
                }
            },
            p: function update(ctx, dirty) {
                if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
                    if_block.p(ctx, dirty);
                } else {
                    if_block.d(1);
                    if_block = current_block_type(ctx);

                    if (if_block) {
                        if_block.c();
                        if_block.m(div1, null);
                    }
                }

                if (dirty[0] & /*questionInput*/ 128 && input.value !== /*questionInput*/ ctx[7]) {
                    set_input_value(input, /*questionInput*/ ctx[7]);
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(div7);
                }

                if_block.d();
                mounted = false;
                run_all(dispose);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block.name,
            type: "else",
            source: "(689:4) {:else}",
            ctx
        });

        return block;
    }

    // (557:4) {#if currentView === 'trainingData'}
    function create_if_block(ctx) {
        let div19;
        let div18;
        let div17;
        let div16;
        let div15;
        let div14;
        let div13;
        let div3;
        let div0;
        let h2;
        let t1;
        let p0;
        let t3;
        let div2;
        let div1;
        let button0;
        let t5;
        let button1;
        let svg0;
        let path0;
        let t6;
        let t7;
        let table;
        let thead;
        let tr;
        let th0;
        let div4;
        let span0;
        let t9;
        let th1;
        let div5;
        let span1;
        let t11;
        let th2;
        let div6;
        let span2;
        let t13;
        let th3;
        let div7;
        let span3;
        let t15;
        let tbody;
        let t16;
        let div12;
        let div9;
        let p1;
        let t18;
        let div8;
        let span4;
        let t20;
        let p2;
        let t22;
        let div11;
        let div10;
        let button2;
        let svg1;
        let path1;
        let t23;
        let t24;
        let button3;
        let t25;
        let svg2;
        let path2;
        let each_value = ensure_array_like_dev(/*trainingData*/ ctx[1]);
        let each_blocks = [];

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
        }

        const block = {
            c: function create() {
                div19 = element("div");
                div18 = element("div");
                div17 = element("div");
                div16 = element("div");
                div15 = element("div");
                div14 = element("div");
                div13 = element("div");
                div3 = element("div");
                div0 = element("div");
                h2 = element("h2");
                h2.textContent = "Training Data";
                t1 = space();
                p0 = element("p");
                p0.textContent = "添加或删除训练数据。良好的训练数据是准确性的关键。";
                t3 = space();
                div2 = element("div");
                div1 = element("div");
                button0 = element("button");
                button0.textContent = "View all";
                t5 = space();
                button1 = element("button");
                svg0 = svg_element("svg");
                path0 = svg_element("path");
                t6 = text("\n                                                    添加训练数据");
                t7 = space();
                table = element("table");
                thead = element("thead");
                tr = element("tr");
                th0 = element("th");
                div4 = element("div");
                span0 = element("span");
                span0.textContent = "Action";
                t9 = space();
                th1 = element("th");
                div5 = element("div");
                span1 = element("span");
                span1.textContent = "Question";
                t11 = space();
                th2 = element("th");
                div6 = element("div");
                span2 = element("span");
                span2.textContent = "Content";
                t13 = space();
                th3 = element("th");
                div7 = element("div");
                span3 = element("span");
                span3.textContent = "Training Data Type";
                t15 = space();
                tbody = element("tbody");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                t16 = space();
                div12 = element("div");
                div9 = element("div");
                p1 = element("p");
                p1.textContent = "Showing:";
                t18 = space();
                div8 = element("div");
                span4 = element("span");
                span4.textContent = "1 - 10";
                t20 = space();
                p2 = element("p");
                p2.textContent = "of 25";
                t22 = space();
                div11 = element("div");
                div10 = element("div");
                button2 = element("button");
                svg1 = svg_element("svg");
                path1 = svg_element("path");
                t23 = text("\n                                                    Prev");
                t24 = space();
                button3 = element("button");
                t25 = text("Next\n                                                    ");
                svg2 = svg_element("svg");
                path2 = svg_element("path");
                attr_dev(h2, "class", "text-xl font-semibold text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(h2, file, 567, 44, 25500);
                attr_dev(p0, "class", "text-sm text-gray-600 dark:text-gray-400 svelte-1uf8i0p");
                add_location(p0, file, 569, 44, 25679);
                attr_dev(div0, "class", "svelte-1uf8i0p");
                add_location(div0, file, 566, 40, 25450);
                attr_dev(button0, "class", "py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800 svelte-1uf8i0p");
                add_location(button0, file, 574, 48, 26029);
                attr_dev(path0, "d", "M2.63452 7.50001L13.6345 7.5M8.13452 13V2");
                attr_dev(path0, "stroke", "currentColor");
                attr_dev(path0, "stroke-width", "2");
                attr_dev(path0, "stroke-linecap", "round");
                attr_dev(path0, "class", "svelte-1uf8i0p");
                add_location(path0, file, 580, 56, 27186);
                attr_dev(svg0, "class", "w-3 h-3 svelte-1uf8i0p");
                attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg0, "width", "16");
                attr_dev(svg0, "height", "16");
                attr_dev(svg0, "viewBox", "0 0 16 16");
                attr_dev(svg0, "fill", "none");
                add_location(svg0, file, 578, 52, 26961);
                attr_dev(button1, "class", "py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800 svelte-1uf8i0p");
                add_location(button1, file, 577, 48, 26617);
                attr_dev(div1, "class", "inline-flex gap-x-2 svelte-1uf8i0p");
                add_location(div1, file, 573, 44, 25947);
                attr_dev(div2, "class", "svelte-1uf8i0p");
                add_location(div2, file, 572, 40, 25897);
                attr_dev(div3, "class", "px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-b border-gray-200 dark:border-gray-700 svelte-1uf8i0p");
                add_location(div3, file, 565, 36, 25286);
                attr_dev(span0, "class", "text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span0, file, 594, 52, 28217);
                attr_dev(div4, "class", "flex items-center gap-x-2 svelte-1uf8i0p");
                add_location(div4, file, 593, 48, 28125);
                attr_dev(th0, "scope", "col");
                attr_dev(th0, "class", "px-6 py-3 text-left svelte-1uf8i0p");
                add_location(th0, file, 592, 44, 28032);
                attr_dev(span1, "class", "text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span1, file, 599, 52, 28658);
                attr_dev(div5, "class", "flex items-center gap-x-2 svelte-1uf8i0p");
                add_location(div5, file, 598, 48, 28566);
                attr_dev(th1, "scope", "col");
                attr_dev(th1, "class", "px-6 py-3 text-left svelte-1uf8i0p");
                add_location(th1, file, 597, 44, 28473);
                attr_dev(span2, "class", "text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span2, file, 604, 52, 29101);
                attr_dev(div6, "class", "flex items-center gap-x-2 svelte-1uf8i0p");
                add_location(div6, file, 603, 48, 29009);
                attr_dev(th2, "scope", "col");
                attr_dev(th2, "class", "px-6 py-3 text-left svelte-1uf8i0p");
                add_location(th2, file, 602, 44, 28916);
                attr_dev(span3, "class", "text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span3, file, 609, 52, 29543);
                attr_dev(div7, "class", "flex items-center gap-x-2 svelte-1uf8i0p");
                add_location(div7, file, 608, 48, 29451);
                attr_dev(th3, "scope", "col");
                attr_dev(th3, "class", "px-6 py-3 text-left svelte-1uf8i0p");
                add_location(th3, file, 607, 44, 29358);
                attr_dev(tr, "class", "svelte-1uf8i0p");
                add_location(tr, file, 591, 40, 27983);
                attr_dev(thead, "class", "bg-gray-50 dark:bg-slate-800 svelte-1uf8i0p");
                add_location(thead, file, 590, 40, 27898);
                attr_dev(tbody, "class", "divide-y divide-gray-200 dark:divide-gray-700 svelte-1uf8i0p");
                add_location(tbody, file, 614, 40, 29902);
                attr_dev(table, "class", "min-w-full divide-y divide-gray-200 dark:divide-gray-700 svelte-1uf8i0p");
                add_location(table, file, 589, 36, 27785);
                attr_dev(p1, "class", "text-sm text-gray-600 dark:text-gray-400 svelte-1uf8i0p");
                add_location(p1, file, 649, 44, 32734);
                attr_dev(span4, "class", "py-2 px-3 pr-9 block w-full border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 svelte-1uf8i0p");
                add_location(span4, file, 651, 48, 32924);
                attr_dev(div8, "class", "max-w-sm space-y-3 svelte-1uf8i0p");
                add_location(div8, file, 650, 44, 32843);
                attr_dev(p2, "class", "text-sm text-gray-600 dark:text-gray-400 svelte-1uf8i0p");
                add_location(p2, file, 653, 44, 33210);
                attr_dev(div9, "class", "inline-flex items-center gap-x-2 svelte-1uf8i0p");
                add_location(div9, file, 648, 40, 32643);
                attr_dev(path1, "fill-rule", "evenodd");
                attr_dev(path1, "d", "M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z");
                attr_dev(path1, "class", "svelte-1uf8i0p");
                add_location(path1, file, 663, 56, 34382);
                attr_dev(svg1, "class", "w-3 h-3 svelte-1uf8i0p");
                attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg1, "width", "16");
                attr_dev(svg1, "height", "16");
                attr_dev(svg1, "fill", "currentColor");
                attr_dev(svg1, "viewBox", "0 0 16 16");
                add_location(svg1, file, 660, 52, 34092);
                attr_dev(button2, "type", "button");
                attr_dev(button2, "class", "py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800 svelte-1uf8i0p");
                add_location(button2, file, 658, 48, 33549);
                attr_dev(path2, "fill-rule", "evenodd");
                attr_dev(path2, "d", "M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z");
                attr_dev(path2, "class", "svelte-1uf8i0p");
                add_location(path2, file, 674, 56, 35712);
                attr_dev(svg2, "class", "w-3 h-3 svelte-1uf8i0p");
                attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg2, "width", "16");
                attr_dev(svg2, "height", "16");
                attr_dev(svg2, "fill", "currentColor");
                attr_dev(svg2, "viewBox", "0 0 16 16");
                add_location(svg2, file, 671, 52, 35422);
                attr_dev(button3, "type", "button");
                attr_dev(button3, "class", "py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800 svelte-1uf8i0p");
                add_location(button3, file, 668, 48, 34822);
                attr_dev(div10, "class", "inline-flex gap-x-2 svelte-1uf8i0p");
                add_location(div10, file, 657, 44, 33467);
                attr_dev(div11, "class", "svelte-1uf8i0p");
                add_location(div11, file, 655, 40, 33359);
                attr_dev(div12, "class", "px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-t border-gray-200 dark:border-gray-700 svelte-1uf8i0p");
                add_location(div12, file, 647, 36, 32479);
                attr_dev(div13, "class", "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-gray-700 svelte-1uf8i0p");
                add_location(div13, file, 564, 32, 25128);
                attr_dev(div14, "class", "p-1.5 min-w-full inline-block align-middle svelte-1uf8i0p");
                add_location(div14, file, 563, 28, 25039);
                attr_dev(div15, "class", "-m-1.5 overflow-x-auto svelte-1uf8i0p");
                add_location(div15, file, 562, 24, 24974);
                attr_dev(div16, "class", "flex flex-col svelte-1uf8i0p");
                add_location(div16, file, 561, 20, 24922);
                attr_dev(div17, "class", "max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto svelte-1uf8i0p");
                add_location(div17, file, 560, 16, 24830);
                attr_dev(div18, "class", "py-10 lg:py-14 svelte-1uf8i0p");
                add_location(div18, file, 559, 12, 24785);
                attr_dev(div19, "class", "relative h-screen w-full lg:pl-64 svelte-1uf8i0p");
                add_location(div19, file, 557, 8, 24695);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div19, anchor);
                append_dev(div19, div18);
                append_dev(div18, div17);
                append_dev(div17, div16);
                append_dev(div16, div15);
                append_dev(div15, div14);
                append_dev(div14, div13);
                append_dev(div13, div3);
                append_dev(div3, div0);
                append_dev(div0, h2);
                append_dev(div0, t1);
                append_dev(div0, p0);
                append_dev(div3, t3);
                append_dev(div3, div2);
                append_dev(div2, div1);
                append_dev(div1, button0);
                append_dev(div1, t5);
                append_dev(div1, button1);
                append_dev(button1, svg0);
                append_dev(svg0, path0);
                append_dev(button1, t6);
                append_dev(div13, t7);
                append_dev(div13, table);
                append_dev(table, thead);
                append_dev(thead, tr);
                append_dev(tr, th0);
                append_dev(th0, div4);
                append_dev(div4, span0);
                append_dev(tr, t9);
                append_dev(tr, th1);
                append_dev(th1, div5);
                append_dev(div5, span1);
                append_dev(tr, t11);
                append_dev(tr, th2);
                append_dev(th2, div6);
                append_dev(div6, span2);
                append_dev(tr, t13);
                append_dev(tr, th3);
                append_dev(th3, div7);
                append_dev(div7, span3);
                append_dev(table, t15);
                append_dev(table, tbody);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    if (each_blocks[i]) {
                        each_blocks[i].m(tbody, null);
                    }
                }

                append_dev(div13, t16);
                append_dev(div13, div12);
                append_dev(div12, div9);
                append_dev(div9, p1);
                append_dev(div9, t18);
                append_dev(div9, div8);
                append_dev(div8, span4);
                append_dev(div9, t20);
                append_dev(div9, p2);
                append_dev(div12, t22);
                append_dev(div12, div11);
                append_dev(div11, div10);
                append_dev(div10, button2);
                append_dev(button2, svg1);
                append_dev(svg1, path1);
                append_dev(button2, t23);
                append_dev(div10, t24);
                append_dev(div10, button3);
                append_dev(button3, t25);
                append_dev(button3, svg2);
                append_dev(svg2, path2);
            },
            p: function update(ctx, dirty) {
                if (dirty[0] & /*trainingData, deleteItem*/ 16386) {
                    each_value = ensure_array_like_dev(/*trainingData*/ ctx[1]);
                    let i;

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context(ctx, each_value, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(tbody, null);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value.length;
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(div19);
                }

                destroy_each(each_blocks, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block.name,
            type: "if",
            source: "(557:4) {#if currentView === 'trainingData'}",
            ctx
        });

        return block;
    }

    // (711:16) {:else }
    function create_else_block_1(ctx) {
        let ul;
        let each_blocks = [];
        let each_1_lookup = new Map();
        let each_value_2 = ensure_array_like_dev(/*conversationHistory*/ ctx[0]);
        const get_key = ctx => /*entry*/ ctx[55].id;
        validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

        for (let i = 0; i < each_value_2.length; i += 1) {
            let child_ctx = get_each_context_2(ctx, each_value_2, i);
            let key = get_key(child_ctx);
            each_1_lookup.set(key, each_blocks[i] = create_each_block_2(key, child_ctx));
        }

        const block = {
            c: function create() {
                ul = element("ul");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                attr_dev(ul, "class", "mt-16 space-y-5 svelte-1uf8i0p");
                add_location(ul, file, 711, 20, 37986);
            },
            m: function mount(target, anchor) {
                insert_dev(target, ul, anchor);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    if (each_blocks[i]) {
                        each_blocks[i].m(ul, null);
                    }
                }
            },
            p: function update(ctx, dirty) {
                if (dirty[0] & /*response_timeout, conversationHistory, playText, showCheckbox*/ 33313) {
                    each_value_2 = ensure_array_like_dev(/*conversationHistory*/ ctx[0]);
                    validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
                    each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, ul, destroy_block, create_each_block_2, null, get_each_context_2);
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(ul);
                }

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].d();
                }
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block_1.name,
            type: "else",
            source: "(711:16) {:else }",
            ctx
        });

        return block;
    }

    // (695:16) {#if talk === false}
    function create_if_block_1(ctx) {
        let li;
        let img;
        let img_src_value;
        let t0;
        let div;
        let p;
        let t1;
        let t2;
        let each_value_1 = ensure_array_like_dev(/*load_questions*/ ctx[3]);
        let each_blocks = [];

        for (let i = 0; i < each_value_1.length; i += 1) {
            each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
        }

        const block = {
            c: function create() {
                li = element("li");
                img = element("img");
                t0 = space();
                div = element("div");
                p = element("p");
                t1 = text(/*header*/ ctx[11]);
                t2 = space();

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                if (!src_url_equal(img.src, img_src_value = "assets/img_1.png")) attr_dev(img, "src", img_src_value);
                attr_dev(img, "class", "flex-shrink-0 w-[2.375rem] h-[2.375rem]  svelte-1uf8i0p");
                attr_dev(img, "alt", "agent logo");
                add_location(img, file, 695, 100, 36916);
                attr_dev(p, "class", "text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(p, file, 700, 28, 37205);
                attr_dev(div, "class", "space-y-3 overflow-x-auto overflow-y-hidden svelte-1uf8i0p");
                add_location(div, file, 699, 24, 37119);
                attr_dev(li, "class", "max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4 svelte-1uf8i0p");
                add_location(li, file, 695, 20, 36836);
            },
            m: function mount(target, anchor) {
                insert_dev(target, li, anchor);
                append_dev(li, img);
                append_dev(li, t0);
                append_dev(li, div);
                append_dev(div, p);
                append_dev(p, t1);
                append_dev(p, t2);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    if (each_blocks[i]) {
                        each_blocks[i].m(p, null);
                    }
                }
            },
            p: function update(ctx, dirty) {
                if (dirty[0] & /*header*/ 2048) set_data_dev(t1, /*header*/ ctx[11]);

                if (dirty[0] & /*load_questions*/ 8) {
                    each_value_1 = ensure_array_like_dev(/*load_questions*/ ctx[3]);
                    let i;

                    for (i = 0; i < each_value_1.length; i += 1) {
                        const child_ctx = get_each_context_1(ctx, each_value_1, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block_1(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(p, null);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value_1.length;
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(li);
                }

                destroy_each(each_blocks, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_1.name,
            type: "if",
            source: "(695:16) {#if talk === false}",
            ctx
        });

        return block;
    }

    // (724:36) {#if showCheckbox}
    function create_if_block_7(ctx) {
        let input;
        let mounted;
        let dispose;

        function input_change_handler() {
            /*input_change_handler*/
            ctx[29].call(input, /*each_value_2*/ ctx[56], /*entry_index*/ ctx[57]);
        }

        const block = {
            c: function create() {
                input = element("input");
                attr_dev(input, "type", "checkbox");
                attr_dev(input, "class", "ml-4 svelte-1uf8i0p");
                add_location(input, file, 724, 40, 39040);
            },
            m: function mount(target, anchor) {
                insert_dev(target, input, anchor);
                input.checked = /*entry*/ ctx[55].selected;

                if (!mounted) {
                    dispose = listen_dev(input, "change", input_change_handler);
                    mounted = true;
                }
            },
            p: function update(new_ctx, dirty) {
                ctx = new_ctx;

                if (dirty[0] & /*conversationHistory*/ 1) {
                    input.checked = /*entry*/ ctx[55].selected;
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(input);
                }

                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_7.name,
            type: "if",
            source: "(724:36) {#if showCheckbox}",
            ctx
        });

        return block;
    }

    // (741:28) {:else}
    function create_else_block_3(ctx) {
        let t;
        let if_block1_anchor;
        let if_block0 = !/*entry*/ ctx[55].show_pd && create_if_block_6(ctx);
        let if_block1 = /*entry*/ ctx[55].show_pd && create_if_block_4(ctx);

        const block = {
            c: function create() {
                if (if_block0) if_block0.c();
                t = space();
                if (if_block1) if_block1.c();
                if_block1_anchor = empty();
            },
            m: function mount(target, anchor) {
                if (if_block0) if_block0.m(target, anchor);
                insert_dev(target, t, anchor);
                if (if_block1) if_block1.m(target, anchor);
                insert_dev(target, if_block1_anchor, anchor);
            },
            p: function update(ctx, dirty) {
                if (!/*entry*/ ctx[55].show_pd) {
                    if (if_block0) {
                        if_block0.p(ctx, dirty);
                    } else {
                        if_block0 = create_if_block_6(ctx);
                        if_block0.c();
                        if_block0.m(t.parentNode, t);
                    }
                } else if (if_block0) {
                    if_block0.d(1);
                    if_block0 = null;
                }

                if (/*entry*/ ctx[55].show_pd) {
                    if (if_block1) {
                        if_block1.p(ctx, dirty);
                    } else {
                        if_block1 = create_if_block_4(ctx);
                        if_block1.c();
                        if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
                    }
                } else if (if_block1) {
                    if_block1.d(1);
                    if_block1 = null;
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(t);
                    detach_dev(if_block1_anchor);
                }

                if (if_block0) if_block0.d(detaching);
                if (if_block1) if_block1.d(detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block_3.name,
            type: "else",
            source: "(741:28) {:else}",
            ctx
        });

        return block;
    }

    // (729:28) {#if !entry.show_response }
    function create_if_block_2(ctx) {
        let li;
        let img;
        let img_src_value;
        let t0;
        let div;
        let t1;

        function select_block_type_3(ctx, dirty) {
            if (/*response_timeout*/ ctx[5]) return create_if_block_3;
            return create_else_block_2;
        }

        let current_block_type = select_block_type_3(ctx);
        let if_block = current_block_type(ctx);

        const block = {
            c: function create() {
                li = element("li");
                img = element("img");
                t0 = space();
                div = element("div");
                if_block.c();
                t1 = space();
                if (!src_url_equal(img.src, img_src_value = "assets/img_1.png")) attr_dev(img, "src", img_src_value);
                attr_dev(img, "class", "flex-shrink-0 w-[2.375rem] h-[2.375rem] animate-bounce  svelte-1uf8i0p");
                attr_dev(img, "alt", "agent logo");
                add_location(img, file, 729, 112, 39392);
                attr_dev(div, "class", "space-y-3 svelte-1uf8i0p");
                add_location(div, file, 732, 36, 39618);
                attr_dev(li, "class", "max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4 svelte-1uf8i0p");
                add_location(li, file, 729, 32, 39312);
            },
            m: function mount(target, anchor) {
                insert_dev(target, li, anchor);
                append_dev(li, img);
                append_dev(li, t0);
                append_dev(li, div);
                if_block.m(div, null);
                append_dev(li, t1);
            },
            p: function update(ctx, dirty) {
                if (current_block_type !== (current_block_type = select_block_type_3(ctx))) {
                    if_block.d(1);
                    if_block = current_block_type(ctx);

                    if (if_block) {
                        if_block.c();
                        if_block.m(div, null);
                    }
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(li);
                }

                if_block.d();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_2.name,
            type: "if",
            source: "(729:28) {#if !entry.show_response }",
            ctx
        });

        return block;
    }

    // (742:32) {#if !entry.show_pd}
    function create_if_block_6(ctx) {
        let li;
        let img;
        let img_src_value;
        let t0;
        let div;
        let p;
        let t1_value = /*entry*/ ctx[55].response + "";
        let t1;
        let t2;
        let button;
        let mounted;
        let dispose;

        function click_handler_3() {
            return /*click_handler_3*/ ctx[30](/*entry*/ ctx[55]);
        }

        const block = {
            c: function create() {
                li = element("li");
                img = element("img");
                t0 = space();
                div = element("div");
                p = element("p");
                t1 = text(t1_value);
                t2 = space();
                button = element("button");
                button.textContent = "播放";
                if (!src_url_equal(img.src, img_src_value = "assets/img_1.png")) attr_dev(img, "src", img_src_value);
                attr_dev(img, "class", "flex-shrink-0 w-[2.375rem] h-[2.375rem]  svelte-1uf8i0p");
                attr_dev(img, "alt", "agent logo");
                add_location(img, file, 742, 116, 40286);
                attr_dev(p, "class", "text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap svelte-1uf8i0p");
                add_location(p, file, 746, 44, 40611);
                attr_dev(button, "type", "button");
                attr_dev(button, "class", "mb-2.5 mr-1.5 py-2 px-3 inline-flex justify-center items-center gap-x-2 rounded-md border border-blue-600 bg-white text-blue-600 align-middle hover:bg-blue-50 text-sm dark:bg-slate-900 dark:text-blue-500 dark:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400 svelte-1uf8i0p");
                add_location(button, file, 749, 44, 40844);
                attr_dev(div, "class", "space-y-3 overflow-x-auto overflow-y-hidden svelte-1uf8i0p");
                add_location(div, file, 745, 40, 40509);
                attr_dev(li, "class", "max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4 svelte-1uf8i0p");
                add_location(li, file, 742, 36, 40206);
            },
            m: function mount(target, anchor) {
                insert_dev(target, li, anchor);
                append_dev(li, img);
                append_dev(li, t0);
                append_dev(li, div);
                append_dev(div, p);
                append_dev(p, t1);
                append_dev(div, t2);
                append_dev(div, button);

                if (!mounted) {
                    dispose = listen_dev(button, "click", click_handler_3, false, false, false, false);
                    mounted = true;
                }
            },
            p: function update(new_ctx, dirty) {
                ctx = new_ctx;
                if (dirty[0] & /*conversationHistory*/ 1 && t1_value !== (t1_value = /*entry*/ ctx[55].response + "")) set_data_dev(t1, t1_value);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(li);
                }

                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_6.name,
            type: "if",
            source: "(742:32) {#if !entry.show_pd}",
            ctx
        });

        return block;
    }

    // (758:32) {#if entry.show_pd}
    function create_if_block_4(ctx) {
        let li1;
        let img;
        let img_src_value;
        let t0;
        let div4;
        let div2;
        let div1;
        let div0;
        let table;
        let thead;
        let tr;
        let t1;
        let tbody;
        let t2;
        let ul;
        let li0;
        let div3;
        let span;
        let t4;
        let a;
        let svg;
        let path0;
        let path1;
        let t5;
        let a_href_value;
        let t6;
        let if_block_anchor;
        let each_value_5 = ensure_array_like_dev(/*entry*/ ctx[55].tableHeaders);
        let each_blocks_1 = [];

        for (let i = 0; i < each_value_5.length; i += 1) {
            each_blocks_1[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
        }

        let each_value_3 = ensure_array_like_dev(/*entry*/ ctx[55].pd_data);
        let each_blocks = [];

        for (let i = 0; i < each_value_3.length; i += 1) {
            each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
        }

        let if_block = /*entry*/ ctx[55].show_chart && create_if_block_5(ctx);

        const block = {
            c: function create() {
                li1 = element("li");
                img = element("img");
                t0 = space();
                div4 = element("div");
                div2 = element("div");
                div1 = element("div");
                div0 = element("div");
                table = element("table");
                thead = element("thead");
                tr = element("tr");

                for (let i = 0; i < each_blocks_1.length; i += 1) {
                    each_blocks_1[i].c();
                }

                t1 = space();
                tbody = element("tbody");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                t2 = space();
                ul = element("ul");
                li0 = element("li");
                div3 = element("div");
                span = element("span");
                span.textContent = "CSV";
                t4 = space();
                a = element("a");
                svg = svg_element("svg");
                path0 = svg_element("path");
                path1 = svg_element("path");
                t5 = text("\n                                                        下载");
                t6 = space();
                if (if_block) if_block.c();
                if_block_anchor = empty();
                if (!src_url_equal(img.src, img_src_value = "assets/img_1.png")) attr_dev(img, "src", img_src_value);
                attr_dev(img, "class", "flex-shrink-0 w-[2.375rem] h-[2.375rem]  svelte-1uf8i0p");
                attr_dev(img, "alt", "agent logo");
                add_location(img, file, 759, 40, 41739);
                attr_dev(tr, "class", "svelte-1uf8i0p");
                add_location(tr, file, 767, 60, 42666);
                attr_dev(thead, "class", "bg-gray-50 dark:bg-slate-800 svelte-1uf8i0p");
                add_location(thead, file, 766, 60, 42561);
                attr_dev(tbody, "class", "divide-y divide-gray-200 dark:divide-gray-700 svelte-1uf8i0p");
                add_location(tbody, file, 779, 60, 43784);
                attr_dev(table, "class", "min-w-full divide-y divide-gray-200 dark:divide-gray-700 svelte-1uf8i0p");
                add_location(table, file, 765, 56, 42428);
                attr_dev(div0, "class", "p-1.5 min-w-full inline-block align-middle  svelte-1uf8i0p");
                add_location(div0, file, 764, 52, 42314);
                attr_dev(div1, "class", "overflow-x-auto overflow-y-auto svelte-1uf8i0p");
                set_style(div1, "max-height", "300px");
                add_location(div1, file, 763, 48, 42191);
                attr_dev(div2, "class", "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-gray-700 svelte-1uf8i0p");
                add_location(div2, file, 762, 44, 42021);
                attr_dev(span, "class", "mr-3 flex-1 w-0 truncate svelte-1uf8i0p");
                add_location(span, file, 802, 102, 45887);
                attr_dev(path0, "d", "M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z");
                attr_dev(path0, "class", "svelte-1uf8i0p");
                add_location(path0, file, 808, 60, 46525);
                attr_dev(path1, "d", "M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z");
                attr_dev(path1, "class", "svelte-1uf8i0p");
                add_location(path1, file, 809, 60, 46739);
                attr_dev(svg, "class", "flex-shrink-0 w-3 h-3 svelte-1uf8i0p");
                attr_dev(svg, "width", "16");
                attr_dev(svg, "height", "16");
                attr_dev(svg, "viewBox", "0 0 16 16");
                attr_dev(svg, "fill", "currentColor");
                add_location(svg, file, 806, 56, 46305);
                attr_dev(a, "class", "flex items-center gap-x-2 text-gray-500 hover:text-blue-500 whitespace-nowrap svelte-1uf8i0p");
                attr_dev(a, "href", a_href_value = "/api/v0/download_csv?id=" + /*entry*/ ctx[55].id);
                add_location(a, file, 803, 104, 45997);
                attr_dev(div3, "class", "w-full flex justify-between truncate svelte-1uf8i0p");
                add_location(div3, file, 802, 52, 45837);
                attr_dev(li0, "class", "flex items-center gap-x-2 p-3 text-sm bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-slate-900 dark:border-gray-700 dark:text-gray-200 svelte-1uf8i0p");
                add_location(li0, file, 801, 48, 45598);
                attr_dev(ul, "class", "flex flex-col justify-end text-start -space-y-px svelte-1uf8i0p");
                add_location(ul, file, 800, 44, 45488);
                attr_dev(div4, "class", "space-y-3 overflow-x-auto overflow-y-hidden svelte-1uf8i0p");
                add_location(div4, file, 761, 40, 41919);
                attr_dev(li1, "class", "max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4 svelte-1uf8i0p");
                add_location(li1, file, 758, 36, 41618);
            },
            m: function mount(target, anchor) {
                insert_dev(target, li1, anchor);
                append_dev(li1, img);
                append_dev(li1, t0);
                append_dev(li1, div4);
                append_dev(div4, div2);
                append_dev(div2, div1);
                append_dev(div1, div0);
                append_dev(div0, table);
                append_dev(table, thead);
                append_dev(thead, tr);

                for (let i = 0; i < each_blocks_1.length; i += 1) {
                    if (each_blocks_1[i]) {
                        each_blocks_1[i].m(tr, null);
                    }
                }

                append_dev(table, t1);
                append_dev(table, tbody);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    if (each_blocks[i]) {
                        each_blocks[i].m(tbody, null);
                    }
                }

                append_dev(div4, t2);
                append_dev(div4, ul);
                append_dev(ul, li0);
                append_dev(li0, div3);
                append_dev(div3, span);
                append_dev(div3, t4);
                append_dev(div3, a);
                append_dev(a, svg);
                append_dev(svg, path0);
                append_dev(svg, path1);
                append_dev(a, t5);
                insert_dev(target, t6, anchor);
                if (if_block) if_block.m(target, anchor);
                insert_dev(target, if_block_anchor, anchor);
            },
            p: function update(ctx, dirty) {
                if (dirty[0] & /*conversationHistory*/ 1) {
                    each_value_5 = ensure_array_like_dev(/*entry*/ ctx[55].tableHeaders);
                    let i;

                    for (i = 0; i < each_value_5.length; i += 1) {
                        const child_ctx = get_each_context_5(ctx, each_value_5, i);

                        if (each_blocks_1[i]) {
                            each_blocks_1[i].p(child_ctx, dirty);
                        } else {
                            each_blocks_1[i] = create_each_block_5(child_ctx);
                            each_blocks_1[i].c();
                            each_blocks_1[i].m(tr, null);
                        }
                    }

                    for (; i < each_blocks_1.length; i += 1) {
                        each_blocks_1[i].d(1);
                    }

                    each_blocks_1.length = each_value_5.length;
                }

                if (dirty[0] & /*conversationHistory*/ 1) {
                    each_value_3 = ensure_array_like_dev(/*entry*/ ctx[55].pd_data);
                    let i;

                    for (i = 0; i < each_value_3.length; i += 1) {
                        const child_ctx = get_each_context_3(ctx, each_value_3, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block_3(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(tbody, null);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value_3.length;
                }

                if (dirty[0] & /*conversationHistory*/ 1 && a_href_value !== (a_href_value = "/api/v0/download_csv?id=" + /*entry*/ ctx[55].id)) {
                    attr_dev(a, "href", a_href_value);
                }

                if (/*entry*/ ctx[55].show_chart) {
                    if (if_block) {
                        if_block.p(ctx, dirty);
                    } else {
                        if_block = create_if_block_5(ctx);
                        if_block.c();
                        if_block.m(if_block_anchor.parentNode, if_block_anchor);
                    }
                } else if (if_block) {
                    if_block.d(1);
                    if_block = null;
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(li1);
                    detach_dev(t6);
                    detach_dev(if_block_anchor);
                }

                destroy_each(each_blocks_1, detaching);
                destroy_each(each_blocks, detaching);
                if (if_block) if_block.d(detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_4.name,
            type: "if",
            source: "(758:32) {#if entry.show_pd}",
            ctx
        });

        return block;
    }

    // (769:64) {#each entry.tableHeaders as header}
    function create_each_block_5(ctx) {
        let th;
        let div;
        let span;
        let t0_value = /*header*/ ctx[11] + "";
        let t0;
        let t1;

        const block = {
            c: function create() {
                th = element("th");
                div = element("div");
                span = element("span");
                t0 = text(t0_value);
                t1 = space();
                attr_dev(span, "class", "text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span, file, 771, 84, 43081);
                attr_dev(div, "class", "flex items-center gap-x-2 svelte-1uf8i0p");
                add_location(div, file, 770, 72, 42957);
                attr_dev(th, "scope", "col");
                attr_dev(th, "class", "px-6 py-3 text-left svelte-1uf8i0p");
                add_location(th, file, 769, 68, 42840);
            },
            m: function mount(target, anchor) {
                insert_dev(target, th, anchor);
                append_dev(th, div);
                append_dev(div, span);
                append_dev(span, t0);
                append_dev(th, t1);
            },
            p: function update(ctx, dirty) {
                if (dirty[0] & /*conversationHistory*/ 1 && t0_value !== (t0_value = /*header*/ ctx[11] + "")) set_data_dev(t0, t0_value);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(th);
                }
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block_5.name,
            type: "each",
            source: "(769:64) {#each entry.tableHeaders as header}",
            ctx
        });

        return block;
    }

    // (783:68) {#each entry.tableHeaders as header}
    function create_each_block_4(ctx) {
        let td;
        let div;
        let span;
        let t_value = /*row*/ ctx[58][/*header*/ ctx[11]] + "";
        let t;

        const block = {
            c: function create() {
                td = element("td");
                div = element("div");
                span = element("span");
                t = text(t_value);
                attr_dev(span, "class", "text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span, file, 785, 88, 44410);
                attr_dev(div, "class", "px-6 py-3 svelte-1uf8i0p");
                add_location(div, file, 784, 76, 44298);
                attr_dev(td, "class", "h-px w-px whitespace-nowrap svelte-1uf8i0p");
                add_location(td, file, 783, 72, 44181);
            },
            m: function mount(target, anchor) {
                insert_dev(target, td, anchor);
                append_dev(td, div);
                append_dev(div, span);
                append_dev(span, t);
            },
            p: function update(ctx, dirty) {
                if (dirty[0] & /*conversationHistory*/ 1 && t_value !== (t_value = /*row*/ ctx[58][/*header*/ ctx[11]] + "")) set_data_dev(t, t_value);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(td);
                }
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block_4.name,
            type: "each",
            source: "(783:68) {#each entry.tableHeaders as header}",
            ctx
        });

        return block;
    }

    // (781:60) {#each entry.pd_data as row}
    function create_each_block_3(ctx) {
        let tr;
        let t;
        let each_value_4 = ensure_array_like_dev(/*entry*/ ctx[55].tableHeaders);
        let each_blocks = [];

        for (let i = 0; i < each_value_4.length; i += 1) {
            each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
        }

        const block = {
            c: function create() {
                tr = element("tr");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                t = space();
                attr_dev(tr, "class", "svelte-1uf8i0p");
                add_location(tr, file, 781, 64, 43999);
            },
            m: function mount(target, anchor) {
                insert_dev(target, tr, anchor);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    if (each_blocks[i]) {
                        each_blocks[i].m(tr, null);
                    }
                }

                append_dev(tr, t);
            },
            p: function update(ctx, dirty) {
                if (dirty[0] & /*conversationHistory*/ 1) {
                    each_value_4 = ensure_array_like_dev(/*entry*/ ctx[55].tableHeaders);
                    let i;

                    for (i = 0; i < each_value_4.length; i += 1) {
                        const child_ctx = get_each_context_4(ctx, each_value_4, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block_4(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(tr, t);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value_4.length;
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(tr);
                }

                destroy_each(each_blocks, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block_3.name,
            type: "each",
            source: "(781:60) {#each entry.pd_data as row}",
            ctx
        });

        return block;
    }

    // (817:36) {#if entry.show_chart}
    function create_if_block_5(ctx) {
        let li0;
        let img0;
        let img0_src_value;
        let t0;
        let div0;
        let div0_id_value;
        let t1;
        let li1;
        let img1;
        let img1_src_value;
        let t2;
        let div1;
        let p;
        let t3_value = (/*entry*/ ctx[55].summary || "此次查询没有得出结论") + "";
        let t3;
        let t4;
        let button;
        let t6;
        let mounted;
        let dispose;

        function click_handler_4() {
            return /*click_handler_4*/ ctx[31](/*entry*/ ctx[55]);
        }

        const block = {
            c: function create() {
                li0 = element("li");
                img0 = element("img");
                t0 = space();
                div0 = element("div");
                t1 = space();
                li1 = element("li");
                img1 = element("img");
                t2 = space();
                div1 = element("div");
                p = element("p");
                t3 = text(t3_value);
                t4 = space();
                button = element("button");
                button.textContent = "播放";
                t6 = space();
                if (!src_url_equal(img0.src, img0_src_value = "assets/img_1.png")) attr_dev(img0, "src", img0_src_value);
                attr_dev(img0, "class", "flex-shrink-0 w-[2.375rem] h-[2.375rem]  svelte-1uf8i0p");
                attr_dev(img0, "alt", "agent logo");
                add_location(img0, file, 818, 44, 47436);
                attr_dev(div0, "id", div0_id_value = "chart-container-" + /*entry*/ ctx[55].id);
                attr_dev(div0, "class", "chart-container svelte-1uf8i0p");
                set_style(div0, "height", "400px");
                add_location(div0, file, 820, 44, 47624);
                attr_dev(li0, "class", "max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4 svelte-1uf8i0p");
                add_location(li0, file, 817, 40, 47311);
                if (!src_url_equal(img1.src, img1_src_value = "assets/img_1.png")) attr_dev(img1, "src", img1_src_value);
                attr_dev(img1, "class", "flex-shrink-0 w-[2.375rem] h-[2.375rem]  svelte-1uf8i0p");
                attr_dev(img1, "alt", "agent logo");
                add_location(img1, file, 825, 44, 48019);
                attr_dev(p, "class", "text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap svelte-1uf8i0p");
                add_location(p, file, 829, 48, 48368);
                attr_dev(button, "type", "button");
                attr_dev(button, "class", "mb-2.5 mr-1.5 py-2 px-3 inline-flex justify-center items-center gap-x-2 rounded-md border border-blue-600 bg-white text-blue-600 align-middle hover:bg-blue-50 text-sm dark:bg-slate-900 dark:text-blue-500 dark:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400 svelte-1uf8i0p");
                add_location(button, file, 832, 48, 48628);
                attr_dev(div1, "class", "space-y-3 overflow-x-auto overflow-y-hidden svelte-1uf8i0p");
                add_location(div1, file, 828, 44, 48262);
                attr_dev(li1, "class", "max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4 svelte-1uf8i0p");
                add_location(li1, file, 824, 40, 47894);
            },
            m: function mount(target, anchor) {
                insert_dev(target, li0, anchor);
                append_dev(li0, img0);
                append_dev(li0, t0);
                append_dev(li0, div0);
                insert_dev(target, t1, anchor);
                insert_dev(target, li1, anchor);
                append_dev(li1, img1);
                append_dev(li1, t2);
                append_dev(li1, div1);
                append_dev(div1, p);
                append_dev(p, t3);
                append_dev(div1, t4);
                append_dev(div1, button);
                append_dev(li1, t6);

                if (!mounted) {
                    dispose = listen_dev(button, "click", click_handler_4, false, false, false, false);
                    mounted = true;
                }
            },
            p: function update(new_ctx, dirty) {
                ctx = new_ctx;

                if (dirty[0] & /*conversationHistory*/ 1 && div0_id_value !== (div0_id_value = "chart-container-" + /*entry*/ ctx[55].id)) {
                    attr_dev(div0, "id", div0_id_value);
                }

                if (dirty[0] & /*conversationHistory*/ 1 && t3_value !== (t3_value = (/*entry*/ ctx[55].summary || "此次查询没有得出结论") + "")) set_data_dev(t3, t3_value);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(li0);
                    detach_dev(t1);
                    detach_dev(li1);
                }

                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_5.name,
            type: "if",
            source: "(817:36) {#if entry.show_chart}",
            ctx
        });

        return block;
    }

    // (736:40) {:else}
    function create_else_block_2(ctx) {
        let p;

        const block = {
            c: function create() {
                p = element("p");
                p.textContent = "思考中...";
                attr_dev(p, "class", "text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(p, file, 736, 44, 39899);
            },
            m: function mount(target, anchor) {
                insert_dev(target, p, anchor);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(p);
                }
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block_2.name,
            type: "else",
            source: "(736:40) {:else}",
            ctx
        });

        return block;
    }

    // (734:40) {#if response_timeout}
    function create_if_block_3(ctx) {
        let p;

        const block = {
            c: function create() {
                p = element("p");
                p.textContent = "回答失败，请稍后重试。";
                attr_dev(p, "class", "text-red-600 dark:text-red-400 svelte-1uf8i0p");
                add_location(p, file, 734, 44, 39749);
            },
            m: function mount(target, anchor) {
                insert_dev(target, p, anchor);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(p);
                }
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_3.name,
            type: "if",
            source: "(734:40) {#if response_timeout}",
            ctx
        });

        return block;
    }

    // (713:24) {#each conversationHistory as entry (entry.id)}
    function create_each_block_2(key_1, ctx) {
        let li;
        let div2;
        let div1;
        let span1;
        let span0;
        let t1;
        let div0;
        let p;
        let t2_value = /*entry*/ ctx[55].question + "";
        let t2;
        let t3;
        let t4;
        let if_block1_anchor;
        let if_block0 = /*showCheckbox*/ ctx[9] && create_if_block_7(ctx);

        function select_block_type_2(ctx, dirty) {
            if (!/*entry*/ ctx[55].show_response) return create_if_block_2;
            return create_else_block_3;
        }

        let current_block_type = select_block_type_2(ctx);
        let if_block1 = current_block_type(ctx);

        const block = {
            key: key_1,
            first: null,
            c: function create() {
                li = element("li");
                div2 = element("div");
                div1 = element("div");
                span1 = element("span");
                span0 = element("span");
                span0.textContent = "你";
                t1 = space();
                div0 = element("div");
                p = element("p");
                t2 = text(t2_value);
                t3 = space();
                if (if_block0) if_block0.c();
                t4 = space();
                if_block1.c();
                if_block1_anchor = empty();
                attr_dev(span0, "class", "text-sm font-medium text-white leading-none svelte-1uf8i0p");
                add_location(span0, file, 716, 157, 38472);
                attr_dev(span1, "class", "flex-shrink-0 inline-flex items-center justify-center h-[2.375rem] w-[2.375rem] rounded-full bg-gray-600 svelte-1uf8i0p");
                add_location(span1, file, 715, 83, 38309);
                attr_dev(p, "class", "text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(p, file, 718, 73, 38663);
                attr_dev(div0, "class", "grow mt-2 space-y-3 svelte-1uf8i0p");
                add_location(div0, file, 718, 40, 38630);
                attr_dev(div1, "class", "max-w-2xl flex gap-x-2 sm:gap-x-4 svelte-1uf8i0p");
                add_location(div1, file, 715, 36, 38262);
                attr_dev(div2, "class", "max-w-4xl px-4 sm:px-6 lg:px-8 mx-auto svelte-1uf8i0p");
                add_location(div2, file, 714, 32, 38173);
                attr_dev(li, "class", "py-2 sm:py-4 svelte-1uf8i0p");
                add_location(li, file, 713, 28, 38115);
                this.first = li;
            },
            m: function mount(target, anchor) {
                insert_dev(target, li, anchor);
                append_dev(li, div2);
                append_dev(div2, div1);
                append_dev(div1, span1);
                append_dev(span1, span0);
                append_dev(div1, t1);
                append_dev(div1, div0);
                append_dev(div0, p);
                append_dev(p, t2);
                append_dev(div2, t3);
                if (if_block0) if_block0.m(div2, null);
                insert_dev(target, t4, anchor);
                if_block1.m(target, anchor);
                insert_dev(target, if_block1_anchor, anchor);
            },
            p: function update(new_ctx, dirty) {
                ctx = new_ctx;
                if (dirty[0] & /*conversationHistory*/ 1 && t2_value !== (t2_value = /*entry*/ ctx[55].question + "")) set_data_dev(t2, t2_value);

                if (/*showCheckbox*/ ctx[9]) {
                    if (if_block0) {
                        if_block0.p(ctx, dirty);
                    } else {
                        if_block0 = create_if_block_7(ctx);
                        if_block0.c();
                        if_block0.m(div2, null);
                    }
                } else if (if_block0) {
                    if_block0.d(1);
                    if_block0 = null;
                }

                if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block1) {
                    if_block1.p(ctx, dirty);
                } else {
                    if_block1.d(1);
                    if_block1 = current_block_type(ctx);

                    if (if_block1) {
                        if_block1.c();
                        if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
                    }
                }
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(li);
                    detach_dev(t4);
                    detach_dev(if_block1_anchor);
                }

                if (if_block0) if_block0.d();
                if_block1.d(detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block_2.name,
            type: "each",
            source: "(713:24) {#each conversationHistory as entry (entry.id)}",
            ctx
        });

        return block;
    }

    // (702:32) {#each load_questions as question}
    function create_each_block_1(ctx) {
        let button;
        let t0_value = /*question*/ ctx[52] + "";
        let t0;
        let t1;

        const block = {
            c: function create() {
                button = element("button");
                t0 = text(t0_value);
                t1 = space();
                attr_dev(button, "type", "button");
                attr_dev(button, "class", "mb-2.5 mr-1.5 py-2 px-3 inline-flex justify-center items-center gap-x-2 rounded-md border border-blue-600 bg-white text-blue-600 align-middle hover:bg-blue-50 text-sm dark:bg-slate-900 dark:text-blue-500 dark:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400 svelte-1uf8i0p");
                add_location(button, file, 702, 36, 37362);
            },
            m: function mount(target, anchor) {
                insert_dev(target, button, anchor);
                append_dev(button, t0);
                append_dev(button, t1);
            },
            p: function update(ctx, dirty) {
                if (dirty[0] & /*load_questions*/ 8 && t0_value !== (t0_value = /*question*/ ctx[52] + "")) set_data_dev(t0, t0_value);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(button);
                }
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block_1.name,
            type: "each",
            source: "(702:32) {#each load_questions as question}",
            ctx
        });

        return block;
    }

    // (618:40) {#each trainingData as item}
    function create_each_block(ctx) {
        let tr;
        let td0;
        let div0;
        let button;
        let t1;
        let td1;
        let div1;
        let span0;
        let t2_value = /*item*/ ctx[49].question + "";
        let t2;
        let t3;
        let td2;
        let div2;
        let span1;
        let t4_value = /*item*/ ctx[49].content + "";
        let t4;
        let t5;
        let td3;
        let div3;
        let span2;
        let t6_value = /*item*/ ctx[49].training_data_type + "";
        let t6;
        let t7;
        let mounted;
        let dispose;

        function click_handler_2() {
            return /*click_handler_2*/ ctx[28](/*item*/ ctx[49]);
        }

        const block = {
            c: function create() {
                tr = element("tr");
                td0 = element("td");
                div0 = element("div");
                button = element("button");
                button.textContent = "Delete";
                t1 = space();
                td1 = element("td");
                div1 = element("div");
                span0 = element("span");
                t2 = text(t2_value);
                t3 = space();
                td2 = element("td");
                div2 = element("div");
                span1 = element("span");
                t4 = text(t4_value);
                t5 = space();
                td3 = element("td");
                div3 = element("div");
                span2 = element("span");
                t6 = text(t6_value);
                t7 = space();
                attr_dev(button, "type", "button");
                attr_dev(button, "class", "py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border-2 border-red-200 font-semibold text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800 svelte-1uf8i0p");
                add_location(button, file, 621, 56, 30343);
                attr_dev(div0, "class", "px-6 py-3 svelte-1uf8i0p");
                add_location(div0, file, 620, 52, 30263);
                attr_dev(td0, "class", "h-px w-px svelte-1uf8i0p");
                add_location(td0, file, 619, 48, 30188);
                attr_dev(span0, "class", "text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span0, file, 630, 56, 31287);
                attr_dev(div1, "class", "px-6 py-3 svelte-1uf8i0p");
                add_location(div1, file, 629, 52, 31207);
                attr_dev(td1, "class", "h-px w-px svelte-1uf8i0p");
                add_location(td1, file, 628, 48, 31132);
                attr_dev(span1, "class", "text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span1, file, 635, 56, 31673);
                attr_dev(div2, "class", "px-6 py-3 svelte-1uf8i0p");
                add_location(div2, file, 634, 52, 31593);
                attr_dev(td2, "class", "h-px w-px svelte-1uf8i0p");
                add_location(td2, file, 633, 48, 31518);
                attr_dev(span2, "class", "text-gray-800 dark:text-gray-200 svelte-1uf8i0p");
                add_location(span2, file, 640, 56, 32058);
                attr_dev(div3, "class", "px-6 py-3 svelte-1uf8i0p");
                add_location(div3, file, 639, 52, 31978);
                attr_dev(td3, "class", "h-px w-px svelte-1uf8i0p");
                add_location(td3, file, 638, 48, 31903);
                attr_dev(tr, "class", "svelte-1uf8i0p");
                add_location(tr, file, 618, 44, 30135);
            },
            m: function mount(target, anchor) {
                insert_dev(target, tr, anchor);
                append_dev(tr, td0);
                append_dev(td0, div0);
                append_dev(div0, button);
                append_dev(tr, t1);
                append_dev(tr, td1);
                append_dev(td1, div1);
                append_dev(div1, span0);
                append_dev(span0, t2);
                append_dev(tr, t3);
                append_dev(tr, td2);
                append_dev(td2, div2);
                append_dev(div2, span1);
                append_dev(span1, t4);
                append_dev(tr, t5);
                append_dev(tr, td3);
                append_dev(td3, div3);
                append_dev(div3, span2);
                append_dev(span2, t6);
                append_dev(tr, t7);

                if (!mounted) {
                    dispose = listen_dev(button, "click", click_handler_2, false, false, false, false);
                    mounted = true;
                }
            },
            p: function update(new_ctx, dirty) {
                ctx = new_ctx;
                if (dirty[0] & /*trainingData*/ 2 && t2_value !== (t2_value = /*item*/ ctx[49].question + "")) set_data_dev(t2, t2_value);
                if (dirty[0] & /*trainingData*/ 2 && t4_value !== (t4_value = /*item*/ ctx[49].content + "")) set_data_dev(t4, t4_value);
                if (dirty[0] & /*trainingData*/ 2 && t6_value !== (t6_value = /*item*/ ctx[49].training_data_type + "")) set_data_dev(t6, t6_value);
            },
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(tr);
                }

                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block.name,
            type: "each",
            source: "(618:40) {#each trainingData as item}",
            ctx
        });

        return block;
    }

    function create_fragment(ctx) {
        let main;
        let div11;
        let nav;
        let div1;
        let img;
        let img_src_value;
        let t0;
        let div0;
        let button0;
        let svg0;
        let path0;
        let t1;
        let span0;
        let t3;
        let div7;
        let ul;
        let li0;
        let button1;
        let svg1;
        let path1;
        let t4;
        let t5;
        let li1;
        let button2;
        let svg2;
        let path2;
        let t6;
        let t7;
        let li2;
        let button3;
        let svg3;
        let path3;
        let t8;
        let t9;
        let t10;
        let li3;
        let button4;
        let svg4;
        let path4;
        let t11;
        let t12;
        let t13;
        let li4;
        let div6;
        let div2;
        let t14;
        let div2_class_value;
        let t15;
        let div4;
        let div3;
        let div3_class_value;
        let t16;
        let div5;
        let t17;
        let div5_class_value;
        let t18;
        let div10;
        let div8;
        let p;
        let span1;
        let t19;
        let t20;
        let div9;
        let a;
        let t21;
        let svg5;
        let path5;
        let path6;
        let t22;
        let mounted;
        let dispose;
        let if_block0 = /*showConfirm*/ ctx[8] && create_if_block_9(ctx);
        let if_block1 = /*showConfirm_ppt*/ ctx[10] && create_if_block_8(ctx);

        function select_block_type(ctx, dirty) {
            if (/*currentView*/ ctx[2] === 'trainingData') return create_if_block;
            return create_else_block;
        }

        let current_block_type = select_block_type(ctx);
        let if_block2 = current_block_type(ctx);

        const block = {
            c: function create() {
                main = element("main");
                div11 = element("div");
                nav = element("nav");
                div1 = element("div");
                img = element("img");
                t0 = space();
                div0 = element("div");
                button0 = element("button");
                svg0 = svg_element("svg");
                path0 = svg_element("path");
                t1 = space();
                span0 = element("span");
                span0.textContent = "Sidebar";
                t3 = space();
                div7 = element("div");
                ul = element("ul");
                li0 = element("li");
                button1 = element("button");
                svg1 = svg_element("svg");
                path1 = svg_element("path");
                t4 = text("\n                            训练数据");
                t5 = space();
                li1 = element("li");
                button2 = element("button");
                svg2 = svg_element("svg");
                path2 = svg_element("path");
                t6 = text("\n                            新的提问");
                t7 = space();
                li2 = element("li");
                button3 = element("button");
                svg3 = svg_element("svg");
                path3 = svg_element("path");
                t8 = text("\n                            生成报告");
                t9 = space();
                if (if_block0) if_block0.c();
                t10 = space();
                li3 = element("li");
                button4 = element("button");
                svg4 = svg_element("svg");
                path4 = svg_element("path");
                t11 = text("\n                            生成PPT");
                t12 = space();
                if (if_block1) if_block1.c();
                t13 = space();
                li4 = element("li");
                div6 = element("div");
                div2 = element("div");
                t14 = text("数据库");
                t15 = space();
                div4 = element("div");
                div3 = element("div");
                t16 = space();
                div5 = element("div");
                t17 = text("文件");
                t18 = space();
                div10 = element("div");
                div8 = element("div");
                p = element("p");
                span1 = element("span");
                t19 = text("\n                    已登录");
                t20 = space();
                div9 = element("div");
                a = element("a");
                t21 = text("注销\n                    ");
                svg5 = svg_element("svg");
                path5 = svg_element("path");
                path6 = svg_element("path");
                t22 = space();
                if_block2.c();
                attr_dev(img, "class", "w-35 h-auto svelte-1uf8i0p");
                if (!src_url_equal(img.src, img_src_value = "assets/img.png")) attr_dev(img, "src", img_src_value);
                attr_dev(img, "alt", "Vanna Logo");
                add_location(img, file, 421, 74, 14760);
                attr_dev(path0, "d", "M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z");
                attr_dev(path0, "class", "svelte-1uf8i0p");
                add_location(path0, file, 430, 28, 15654);
                attr_dev(svg0, "class", "w-4 h-4 svelte-1uf8i0p");
                attr_dev(svg0, "width", "16");
                attr_dev(svg0, "height", "16");
                attr_dev(svg0, "fill", "currentColor");
                attr_dev(svg0, "viewBox", "0 0 16 16");
                add_location(svg0, file, 429, 24, 15541);
                attr_dev(span0, "class", "sr-only svelte-1uf8i0p");
                add_location(span0, file, 432, 24, 15904);
                attr_dev(button0, "type", "button");
                attr_dev(button0, "class", "w-8 h-8 inline-flex justify-center items-center gap-2 rounded-md text-gray-700 align-middle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all dark:text-gray-400 dark:focus:ring-offset-gray-800 svelte-1uf8i0p");
                attr_dev(button0, "data-hs-overlay", "#application-sidebar");
                attr_dev(button0, "aria-controls", "application-sidebar");
                attr_dev(button0, "aria-label", "Toggle navigation");
                add_location(button0, file, 425, 20, 15042);
                attr_dev(div0, "class", "lg:hidden svelte-1uf8i0p");
                add_location(div0, file, 424, 16, 14998);
                attr_dev(div1, "class", "flex items-center justify-between py-4 pr-4 pl-7 svelte-1uf8i0p");
                add_location(div1, file, 421, 12, 14698);
                attr_dev(path1, "stroke-linecap", "round");
                attr_dev(path1, "stroke-linejoin", "round");
                attr_dev(path1, "d", "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5");
                attr_dev(path1, "class", "svelte-1uf8i0p");
                add_location(path1, file, 442, 32, 16677);
                attr_dev(svg1, "class", "w-3.5 h-3.5 svelte-1uf8i0p");
                attr_dev(svg1, "fill", "none");
                attr_dev(svg1, "stroke", "currentColor");
                attr_dev(svg1, "stroke-width", "1.5");
                attr_dev(svg1, "viewBox", "0 0 24 24");
                attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg1, "aria-hidden", "true");
                add_location(svg1, file, 440, 28, 16459);
                attr_dev(button1, "class", "flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 border-t border-b border-gray-200 dark:border-gray-700 w-full svelte-1uf8i0p");
                add_location(button1, file, 438, 24, 16119);
                attr_dev(li0, "class", "svelte-1uf8i0p");
                add_location(li0, file, 437, 20, 16090);
                attr_dev(path2, "fill-rule", "evenodd");
                attr_dev(path2, "clip-rule", "evenodd");
                attr_dev(path2, "d", "M8 2C8.47339 2 8.85714 2.38376 8.85714 2.85714V7.14286L13.1429 7.14286C13.6162 7.14286 14 7.52661 14 8C14 8.47339 13.6162 8.85714 13.1429 8.85714L8.85714 8.85715V13.1429C8.85714 13.6162 8.47339 14 8 14C7.52661 14 7.14286 13.6162 7.14286 13.1429V8.85715L2.85714 8.85715C2.38376 8.85715 2 8.4734 2 8.00001C2 7.52662 2.38376 7.14287 2.85714 7.14287L7.14286 7.14286V2.85714C7.14286 2.38376 7.52661 2 8 2Z");
                attr_dev(path2, "fill", "currentColor");
                attr_dev(path2, "class", "svelte-1uf8i0p");
                add_location(path2, file, 454, 32, 17896);
                attr_dev(svg2, "class", "w-3.5 h-3.5 svelte-1uf8i0p");
                attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg2, "width", "16");
                attr_dev(svg2, "height", "16");
                attr_dev(svg2, "fill", "currentColor");
                attr_dev(svg2, "viewBox", "0 0 16 16");
                add_location(svg2, file, 452, 28, 17707);
                attr_dev(button2, "class", "flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 svelte-1uf8i0p");
                add_location(button2, file, 450, 24, 17434);
                attr_dev(li1, "class", "svelte-1uf8i0p");
                add_location(li1, file, 449, 20, 17405);
                attr_dev(path3, "d", "M12.5 0h-9A1.5 1.5 0 0 0 2 1.5v13A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5V1.5A1.5 1.5 0 0 0 12.5 0zM8 13.5a.5.5 0 0 1-.5-.5V9H5a.5.5 0 0 1 0-1h2.5V5a.5.5 0 0 1 1 0v2h2.5a.5.5 0 0 1 0 1H8V13a.5.5 0 0 1-.5.5z");
                attr_dev(path3, "class", "svelte-1uf8i0p");
                add_location(path3, file, 467, 32, 19168);
                attr_dev(svg3, "class", "w-3.5 h-3.5 svelte-1uf8i0p");
                attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg3, "width", "16");
                attr_dev(svg3, "height", "16");
                attr_dev(svg3, "fill", "currentColor");
                attr_dev(svg3, "viewBox", "0 0 16 16");
                add_location(svg3, file, 466, 28, 19012);
                attr_dev(button3, "class", "flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 svelte-1uf8i0p");
                add_location(button3, file, 463, 24, 18707);
                attr_dev(li2, "class", "relative svelte-1uf8i0p");
                add_location(li2, file, 462, 20, 18635);
                attr_dev(path4, "d", "M12.5 0h-9A1.5 1.5 0 0 0 2 1.5v13A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5V1.5A1.5 1.5 0 0 0 12.5 0zM8 13.5a.5.5 0 0 1-.5-.5V9H5a.5.5 0 0 1 0-1h2.5V5a.5.5 0 0 1 1 0v2h2.5a.5.5 0 0 1 0 1H8V13a.5.5 0 0 1-.5.5z");
                attr_dev(path4, "class", "svelte-1uf8i0p");
                add_location(path4, file, 496, 32, 21002);
                attr_dev(svg4, "class", "w-3.5 h-3.5 svelte-1uf8i0p");
                attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg4, "width", "16");
                attr_dev(svg4, "height", "16");
                attr_dev(svg4, "fill", "currentColor");
                attr_dev(svg4, "viewBox", "0 0 16 16");
                add_location(svg4, file, 495, 28, 20846);
                attr_dev(button4, "class", "flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 svelte-1uf8i0p");
                add_location(button4, file, 492, 24, 20537);
                attr_dev(li3, "class", "relative svelte-1uf8i0p");
                add_location(li3, file, 491, 20, 20465);
                attr_dev(div2, "class", div2_class_value = "mode-text " + (/*mode*/ ctx[6] === 'database' ? 'active' : '') + " svelte-1uf8i0p");
                add_location(div2, file, 525, 28, 22752);
                attr_dev(div3, "class", div3_class_value = "toggle-ball " + (/*mode*/ ctx[6] === 'database' ? 'left' : 'right') + " svelte-1uf8i0p");
                add_location(div3, file, 527, 32, 22911);
                attr_dev(div4, "class", "toggle-switch svelte-1uf8i0p");
                add_location(div4, file, 526, 28, 22851);
                attr_dev(div5, "class", div5_class_value = "mode-text " + (/*mode*/ ctx[6] === 'file' ? 'active' : '') + " svelte-1uf8i0p");
                add_location(div5, file, 529, 28, 23047);
                attr_dev(div6, "class", "flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 border-t border-b border-gray-200 dark:border-gray-700 w-full svelte-1uf8i0p");
                add_location(div6, file, 521, 24, 22380);
                attr_dev(li4, "class", "svelte-1uf8i0p");
                add_location(li4, file, 519, 20, 22309);
                attr_dev(ul, "class", "space-y-1.5 p-4 svelte-1uf8i0p");
                add_location(ul, file, 436, 16, 16041);
                attr_dev(div7, "class", "h-full svelte-1uf8i0p");
                add_location(div7, file, 435, 12, 16004);
                attr_dev(span1, "class", "block w-1.5 h-1.5 rounded-full bg-green-600 svelte-1uf8i0p");
                add_location(span1, file, 538, 88, 23379);
                attr_dev(p, "class", "inline-flex items-center gap-x-2 text-xs text-green-600 svelte-1uf8i0p");
                add_location(p, file, 537, 41, 23288);
                attr_dev(div8, "class", "py-2.5 px-7 svelte-1uf8i0p");
                add_location(div8, file, 537, 16, 23263);
                attr_dev(path5, "fill-rule", "evenodd");
                attr_dev(path5, "d", "M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0v-2z");
                attr_dev(path5, "class", "svelte-1uf8i0p");
                add_location(path5, file, 546, 24, 24026);
                attr_dev(path6, "fill-rule", "evenodd");
                attr_dev(path6, "d", "M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z");
                attr_dev(path6, "class", "svelte-1uf8i0p");
                add_location(path6, file, 548, 24, 24331);
                attr_dev(svg5, "class", "w-3.5 h-3.5 svelte-1uf8i0p");
                attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg5, "width", "16");
                attr_dev(svg5, "height", "16");
                attr_dev(svg5, "fill", "currentColor");
                attr_dev(svg5, "viewBox", "0 0 16 16");
                add_location(svg5, file, 544, 20, 23853);
                attr_dev(a, "class", "flex justify-between items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 svelte-1uf8i0p");
                attr_dev(a, "href", "#replace");
                add_location(a, file, 541, 79, 23582);
                attr_dev(div9, "class", "p-4 border-t border-gray-200 dark:border-gray-700 svelte-1uf8i0p");
                add_location(div9, file, 541, 16, 23519);
                attr_dev(div10, "class", "mt-auto svelte-1uf8i0p");
                add_location(div10, file, 536, 12, 23225);
                attr_dev(nav, "class", "hs-accordion-group w-full h-full flex flex-col svelte-1uf8i0p");
                attr_dev(nav, "data-hs-accordion-always-open", "");
                add_location(nav, file, 420, 8, 14592);
                attr_dev(div11, "id", "application-sidebar");
                attr_dev(div11, "class", "hs-overlay hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform hidden fixed top-0 left-0 bottom-0 z-[60] w-64 bg-white border-r border-gray-200 overflow-y-auto scrollbar-y lg:block lg:translate-x-0 lg:right-auto lg:bottom-0 dark:scrollbar-y dark:bg-slate-900 dark:border-gray-700 svelte-1uf8i0p");
                add_location(div11, file, 418, 4, 14222);
                attr_dev(main, "class", "svelte-1uf8i0p");
                add_location(main, file, 417, 0, 14211);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, main, anchor);
                append_dev(main, div11);
                append_dev(div11, nav);
                append_dev(nav, div1);
                append_dev(div1, img);
                append_dev(div1, t0);
                append_dev(div1, div0);
                append_dev(div0, button0);
                append_dev(button0, svg0);
                append_dev(svg0, path0);
                append_dev(button0, t1);
                append_dev(button0, span0);
                append_dev(nav, t3);
                append_dev(nav, div7);
                append_dev(div7, ul);
                append_dev(ul, li0);
                append_dev(li0, button1);
                append_dev(button1, svg1);
                append_dev(svg1, path1);
                append_dev(button1, t4);
                append_dev(ul, t5);
                append_dev(ul, li1);
                append_dev(li1, button2);
                append_dev(button2, svg2);
                append_dev(svg2, path2);
                append_dev(button2, t6);
                append_dev(ul, t7);
                append_dev(ul, li2);
                append_dev(li2, button3);
                append_dev(button3, svg3);
                append_dev(svg3, path3);
                append_dev(button3, t8);
                append_dev(li2, t9);
                if (if_block0) if_block0.m(li2, null);
                append_dev(ul, t10);
                append_dev(ul, li3);
                append_dev(li3, button4);
                append_dev(button4, svg4);
                append_dev(svg4, path4);
                append_dev(button4, t11);
                append_dev(li3, t12);
                if (if_block1) if_block1.m(li3, null);
                append_dev(ul, t13);
                append_dev(ul, li4);
                append_dev(li4, div6);
                append_dev(div6, div2);
                append_dev(div2, t14);
                append_dev(div6, t15);
                append_dev(div6, div4);
                append_dev(div4, div3);
                append_dev(div6, t16);
                append_dev(div6, div5);
                append_dev(div5, t17);
                append_dev(nav, t18);
                append_dev(nav, div10);
                append_dev(div10, div8);
                append_dev(div8, p);
                append_dev(p, span1);
                append_dev(p, t19);
                append_dev(div10, t20);
                append_dev(div10, div9);
                append_dev(div9, a);
                append_dev(a, t21);
                append_dev(a, svg5);
                append_dev(svg5, path5);
                append_dev(svg5, path6);
                append_dev(main, t22);
                if_block2.m(main, null);

                if (!mounted) {
                    dispose = [
                        listen_dev(button1, "click", /*click_handler*/ ctx[26], false, false, false, false),
                        listen_dev(button2, "click", /*click_handler_1*/ ctx[27], false, false, false, false),
                        listen_dev(button3, "click", /*showReportConfirm*/ ctx[19], false, false, false, false),
                        listen_dev(button4, "click", /*showReportConfirm_ppt*/ ctx[21], false, false, false, false),
                        listen_dev(div6, "click", /*toggleMode*/ ctx[12], false, false, false, false)
                    ];

                    mounted = true;
                }
            },
            p: function update(ctx, dirty) {
                if (/*showConfirm*/ ctx[8]) {
                    if (if_block0) {
                        if_block0.p(ctx, dirty);
                    } else {
                        if_block0 = create_if_block_9(ctx);
                        if_block0.c();
                        if_block0.m(li2, null);
                    }
                } else if (if_block0) {
                    if_block0.d(1);
                    if_block0 = null;
                }

                if (/*showConfirm_ppt*/ ctx[10]) {
                    if (if_block1) {
                        if_block1.p(ctx, dirty);
                    } else {
                        if_block1 = create_if_block_8(ctx);
                        if_block1.c();
                        if_block1.m(li3, null);
                    }
                } else if (if_block1) {
                    if_block1.d(1);
                    if_block1 = null;
                }

                if (dirty[0] & /*mode*/ 64 && div2_class_value !== (div2_class_value = "mode-text " + (/*mode*/ ctx[6] === 'database' ? 'active' : '') + " svelte-1uf8i0p")) {
                    attr_dev(div2, "class", div2_class_value);
                }

                if (dirty[0] & /*mode*/ 64 && div3_class_value !== (div3_class_value = "toggle-ball " + (/*mode*/ ctx[6] === 'database' ? 'left' : 'right') + " svelte-1uf8i0p")) {
                    attr_dev(div3, "class", div3_class_value);
                }

                if (dirty[0] & /*mode*/ 64 && div5_class_value !== (div5_class_value = "mode-text " + (/*mode*/ ctx[6] === 'file' ? 'active' : '') + " svelte-1uf8i0p")) {
                    attr_dev(div5, "class", div5_class_value);
                }

                if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
                    if_block2.p(ctx, dirty);
                } else {
                    if_block2.d(1);
                    if_block2 = current_block_type(ctx);

                    if (if_block2) {
                        if_block2.c();
                        if_block2.m(main, null);
                    }
                }
            },
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                if (detaching) {
                    detach_dev(main);
                }

                if (if_block0) if_block0.d();
                if (if_block1) if_block1.d();
                if_block2.d();
                mounted = false;
                run_all(dispose);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function instance($$self, $$props, $$invalidate) {
        let {$$slots: slots = {}, $$scope} = $$props;
        validate_slots('App', slots, []);
        let trainingData = [];
        let currentView = 'default'; // 默认视图
        let errorMessage = ''; // 用于存储错误信息
        let isMounted = false; // 用于标记组件是否已经挂载
        let load_questions = []; // 存储获取的问题
        let header = ''; // 存储标题
        let talk = false; //是否进入谈话界面
        let response_timeout = false;

        // 当组件挂载时，获取问题数据
        onMount(async () => {
            if (!isMounted) {
                isMounted = true;
                const response = await fetch('/api/v0/generate_questions');
                const data = await response.json();

                // 处理获取的数据
                if (data.type === 'question_list') {
                    $$invalidate(3, load_questions = data.questions); // 获取问题列表
                    $$invalidate(11, header = data.header); // 获取标题
                }
            }
        });

        let mode = 'database'; // 默认状态为数据库模式

        // 切换模式函数
        function toggleMode() {
            $$invalidate(6, mode = mode === 'database' ? 'file' : 'database');
            console.log(`切换到: ${mode === 'database' ? '数据库' : '文件'}`);
        }

        async function switchView(view) {
            $$invalidate(2, currentView = view);

            if (view === 'trainingData') {
                const response = await fetch('/api/v0/get_training_data');
                const data = await response.json();

                if (data.type === 'df') {
                    $$invalidate(1, trainingData = JSON.parse(data.df)); // 解析数据并赋值给 trainingData
                }
            }
        }

        async function deleteItem(id) {
            const response = await fetch('/api/v0/remove_training_data', {
                method: 'POST', // 使用 POST 方法
                headers: {
                    'Content-Type': 'application/json', // 设置请求头为 JSON

                },
                body: JSON.stringify({id}), // 将 id 封装为 JSON 对象

            });

            const result = await response.json();

            if (result.success) {
                switchView("trainingData");
            } else {
                console.error(
                    result.error
                );
            } // 处理错误情况
        }

        let questionInput = ''; // 用于存储输入框的内容
        let questionInput_tmp = ''; //用于复制输入框的内容
        let response_json = ""; //llm响应的json
        let response = ""; //llm响应
        let response_chart = ""; //图表的响应
        let response_tmp = ""; //用于装载修改sql时候的响应
        let pd_response = "";
        let pd_data = "";
        let chart_data = "";
        let tableHeaders = "";
        let cycle = 0;
        let container = ""; //显示图表的容器
        let conversationHistory = []; // 存储对话记录

        function renderChart(id, chartData) {
            $$invalidate(25, container = document.getElementById(`chart-container-${id}`));
            console.log("开始渲染图表");

            if (container && chartData) {
                try {
                    Plotly.newPlot(container, chartData.data, chartData.layout || {}).then(() => {
                        // 动态移除 logo 按钮
                        const logoButton = container.querySelector('.modebar-btn--logo');

                        if (logoButton) {
                            logoButton.remove();
                        }
                    });
                } catch (error) {
                    console.error("图表渲染失败:", error);
                } // 你可以在这里做一个错误提示或者设置默认的图表状态
            }
        }

        const synth = window.speechSynthesis;
        let isPlaying = false; // 控制语音播放状态

        function playText(text) {
            //语言播放
            // Microsoft Huihui、Microsoft Kangkang 或 Microsoft Yaoyao
            // 如果正在播放语音，则返回
            if (isPlaying || synth.speaking) {
                console.log("当前语音正在播放中，无法开始新的播放");
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "zh-CN";
            utterance.pitch = 1.5;
            utterance.rate = 1.2;

            // 获取语音列表并选择指定语音
            const voices = synth.getVoices();

            const selectedVoice = voices.find(voice => voice.lang === "zh-CN" && voice.name.includes("Microsoft Yaoyao"));

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            // 播放语音前设置播放状态
            isPlaying = true;

            // 当语音播放结束时，重置播放状态
            utterance.onend = () => {
                console.log("语音播放完毕，准备下次播放");
                isPlaying = false; // 播放结束后允许新语音播放
            };

            // 开始播放语音
            synth.speak(utterance);
        }

        // 创建语音识别对象（支持的浏览器需要提供 Web Speech API）
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

        // 设置语言为中文
        recognition.lang = 'zh-CN'; // 设置为中文

        recognition.interimResults = true; // 实时返回识别结果
        recognition.maxAlternatives = 1; // 只返回最有可能的识别结果

        // 识别到语音时的回调
        recognition.onresult = event => {
            // 获取识别到的文本
            $$invalidate(7, questionInput = event.results[0][0].transcript);
        };

        // 错误回调
        recognition.onerror = event => {
            console.error("语音识别错误:", event.error);
        };

        // 开始语音识别
        function startSpeechRecognition() {
            recognition.start();
        }

        const handleGenerateSQL = async () => {
            // 发送请求到后端
            try {
                questionInput_tmp = questionInput;
                $$invalidate(7, questionInput = '');
                $$invalidate(4, talk = true);
                $$invalidate(5, response_timeout = false);

                conversationHistory.push({
                    id: 12,
                    question: questionInput_tmp,
                    response: "",
                    show_response: false,
                    show_pd: false,
                    pd_data: "",
                    tableHeaders: "",
                    show_chart: false,
                    chartData: "",
                    summary: "",
                    selected: false
                });

                $$invalidate(0, conversationHistory = [...conversationHistory]); //这里更新界面，展示思考中的动画
                response_json = await fetch(`/api/v0/generate_sql?question=${encodeURIComponent(questionInput_tmp)}&&former_doc_list=false&&mode_web=${encodeURIComponent(mode)}`);

                if (response_json.ok) {
                    response = await response_json.json();

                    if (response.type === 'sql') {
                        if (response.sql_que !== "") {
                            pd_response = await fetch(`/api/v0/run_sql?id=${encodeURIComponent(response.id)}`);
                            pd_data = await pd_response.json();
                            console.log(pd_data.ok);
                            console.log(cycle);

                            while (pd_response.ok && pd_data.type === "error" && cycle < 4) {
                                //第一次sql执行错误，把错误继续提问，重新生成sql，直到能查询到数据为止
                                cycle += 1;

                                if (cycle === 4) {
                                    $$invalidate(5, response_timeout = true);
                                    break;
                                }

                                console.log(cycle);
                                response_json = await fetch(`/api/v0/generate_sql?question=${encodeURIComponent(pd_data.error)}&&former_doc_list=true&&mode_web=${encodeURIComponent(mode)}`);

                                if (response_json.ok) {
                                    console.log("进入1");
                                    response = await response_json.json();

                                    if (response.type === 'sql') {
                                        // conversationHistory[conversationHistory.length - 1].show_response = true;
                                        // conversationHistory[conversationHistory.length - 1].response = response.text;
                                        // conversationHistory[conversationHistory.length - 1].id = response.id;
                                        console.log("进入2");

                                        if (response.sql_que !== "") {
                                            pd_response = await fetch(`/api/v0/run_sql?id=${encodeURIComponent(response.id)}`);
                                            pd_data = await pd_response.json();
                                            console.log("进入3");
                                        } else {
                                            pd_data.error += "重新生成一次，找不到sql";
                                        }
                                    }
                                }
                            }

                            cycle = 0;

                            if (pd_data.type !== "error") {
                                pd_data = JSON.parse(pd_data.df); // 将返回的数据赋值给 tableData

                                // console.log(pd_data[1]);  // 检查 pd_data 的内容和类型
                                // 动态生成表头
                                if (pd_data.length > 0) {
                                    tableHeaders = Object.keys(pd_data[0]); // 获取字段名
                                } // console.log(tableHeaders);

                                $$invalidate(0, conversationHistory[conversationHistory.length - 1].show_pd = true, conversationHistory);
                                $$invalidate(0, conversationHistory[conversationHistory.length - 1].pd_data = pd_data, conversationHistory);
                                $$invalidate(0, conversationHistory[conversationHistory.length - 1].tableHeaders = tableHeaders, conversationHistory);
                                response_chart = await fetch(`/api/v0/generate_plotly_figure?id=${encodeURIComponent(response.id)}&&question=${encodeURIComponent(questionInput_tmp)}`);
                                chart_data = await response_chart.json();

                                if (chart_data.type === "plotly_figure") {
                                    const figJson = JSON.parse(chart_data.fig);
                                    console.log("获得图表代码");
                                    console.log(figJson);
                                    $$invalidate(0, conversationHistory[conversationHistory.length - 1].show_chart = true, conversationHistory);
                                    $$invalidate(0, conversationHistory[conversationHistory.length - 1].chartData = figJson, conversationHistory);
                                    $$invalidate(0, conversationHistory[conversationHistory.length - 1].summary = chart_data.summary, conversationHistory);
                                    console.log("总结：" + conversationHistory[conversationHistory.length - 1].summary);
                                }
                            }
                        }

                        if (response_timeout !== true) {
                            $$invalidate(0, conversationHistory[conversationHistory.length - 1].show_response = true, conversationHistory);
                            $$invalidate(0, conversationHistory[conversationHistory.length - 1].response = response.text, conversationHistory);
                            $$invalidate(0, conversationHistory[conversationHistory.length - 1].id = response.id, conversationHistory);
                        }
                    }

                    $$invalidate(0, conversationHistory = [...conversationHistory]);
                }
            } catch (error) {
                console.error('Fetch错误:', error);
                errorMessage = '请求失败，请稍后重试。'; // 设置错误信息
            }
        };

        const handleKeyDown = event => {
            if (event.key === 'Enter') {
                // 调用生成 SQL 的处理函数
                handleGenerateSQL();
            }
        };

        let showConfirm = false;
        let showCheckbox = false; // 控制勾选框显示
        let showConfirm_ppt = false;

        // 显示确认框
        function showReportConfirm() {
            $$invalidate(9, showCheckbox = true); // 显示勾选框
            $$invalidate(8, showConfirm = true); // 显示确认框
        }

        // 取消生成报告
        function cancelReport() {
            $$invalidate(8, showConfirm = false);
            $$invalidate(9, showCheckbox = false); // 隐藏勾选框
        }

        function showReportConfirm_ppt() {
            $$invalidate(9, showCheckbox = true); // 显示勾选框
            $$invalidate(10, showConfirm_ppt = true); // 显示确认框
        }

        // 取消生成报告
        function cancelReport_ppt() {
            $$invalidate(10, showConfirm_ppt = false);
            $$invalidate(9, showCheckbox = false); // 隐藏勾选框
        }

        // 生成报告
        async function generateReport() {
            const selectedEntries = conversationHistory.filter(entry => entry.selected);

            // 创建一个新的列表，用于保持顺序
            const reportList = [];

            selectedEntries.forEach(entry => {
                // 先加入 question
                reportList.push(entry.question);

                const pdDataStr = JSON.stringify(entry.pd_data); // 将 pd_data 转换为字符串
                const summaryStr = entry.summary; // summary 已经是字符串

                // 合并 pd_data 和 summary，形成一个字符串
                const pdSummaryStr = `查到的数据表: ${pdDataStr}\n数据表的总结: ${summaryStr}`;

                // 将合并后的字符串添加到 reportList
                reportList.push(pdSummaryStr);
            });

            // 后端接口调用，传递报告列表生成文档
            const response = await fetch('/api/v0/generate_word', {
                method: 'POST',
                body: JSON.stringify({reportList}),
                headers: {'Content-Type': 'application/json'}
            });

            if (response.ok) {
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = '财务分析报告.docx';
                link.click();
            }

            // 隐藏确认框和勾选框
            $$invalidate(8, showConfirm = false);

            $$invalidate(9, showCheckbox = false);
        }

        async function generatePPT() {
            const selectedEntries = conversationHistory.filter(entry => entry.selected);

            // 创建一个新的列表，用于保持顺序
            const reportList = [];

            selectedEntries.forEach(entry => {
                // 先加入 question
                reportList.push(entry.question);

                const pdDataStr = JSON.stringify(entry.pd_data); // 将 pd_data 转换为字符串
                const summaryStr = entry.summary; // summary 已经是字符串

                // 合并 pd_data 和 summary，形成一个字符串
                const pdSummaryStr = `查到的数据表: ${pdDataStr}\n数据表的总结: ${summaryStr}`;

                // 将合并后的字符串添加到 reportList
                reportList.push(pdSummaryStr);
            });

            // 后端接口调用，传递报告列表生成文档
            const response = await fetch('/api/v0/generate_PPT', {
                method: 'POST',
                body: JSON.stringify({reportList}),
                headers: {'Content-Type': 'application/json'}
            });

            if (response.ok) {
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = '财务分析报告.pptx';
                link.click();
            }

            // 隐藏确认框和勾选框
            $$invalidate(10, showConfirm_ppt = false);

            $$invalidate(9, showCheckbox = false);
        }

        const writable_props = [];

        Object_1.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
        });

        const click_handler = () => switchView('trainingData');
        const click_handler_1 = () => switchView('default');
        const click_handler_2 = item => deleteItem(item.id);

        function input_change_handler(each_value_2, entry_index) {
            each_value_2[entry_index].selected = this.checked;
            $$invalidate(0, conversationHistory);
        }

        const click_handler_3 = entry => playText(entry.response);
        const click_handler_4 = entry => playText(entry.summary || "此次查询没有得出结论");

        function input_input_handler() {
            questionInput = this.value;
            $$invalidate(7, questionInput);
        }

        $$self.$capture_state = () => ({
            trainingData,
            currentView,
            errorMessage,
            onMount,
            afterUpdate,
            isMounted,
            load_questions,
            header,
            talk,
            response_timeout,
            mode,
            toggleMode,
            switchView,
            deleteItem,
            tick,
            questionInput,
            questionInput_tmp,
            response_json,
            response,
            response_chart,
            response_tmp,
            pd_response,
            pd_data,
            chart_data,
            tableHeaders,
            cycle,
            container,
            conversationHistory,
            renderChart,
            synth,
            isPlaying,
            playText,
            recognition,
            startSpeechRecognition,
            handleGenerateSQL,
            handleKeyDown,
            showConfirm,
            showCheckbox,
            showConfirm_ppt,
            showReportConfirm,
            cancelReport,
            showReportConfirm_ppt,
            cancelReport_ppt,
            generateReport,
            generatePPT
        });

        $$self.$inject_state = $$props => {
            if ('trainingData' in $$props) $$invalidate(1, trainingData = $$props.trainingData);
            if ('currentView' in $$props) $$invalidate(2, currentView = $$props.currentView);
            if ('errorMessage' in $$props) errorMessage = $$props.errorMessage;
            if ('isMounted' in $$props) isMounted = $$props.isMounted;
            if ('load_questions' in $$props) $$invalidate(3, load_questions = $$props.load_questions);
            if ('header' in $$props) $$invalidate(11, header = $$props.header);
            if ('talk' in $$props) $$invalidate(4, talk = $$props.talk);
            if ('response_timeout' in $$props) $$invalidate(5, response_timeout = $$props.response_timeout);
            if ('mode' in $$props) $$invalidate(6, mode = $$props.mode);
            if ('questionInput' in $$props) $$invalidate(7, questionInput = $$props.questionInput);
            if ('questionInput_tmp' in $$props) questionInput_tmp = $$props.questionInput_tmp;
            if ('response_json' in $$props) response_json = $$props.response_json;
            if ('response' in $$props) response = $$props.response;
            if ('response_chart' in $$props) response_chart = $$props.response_chart;
            if ('response_tmp' in $$props) response_tmp = $$props.response_tmp;
            if ('pd_response' in $$props) pd_response = $$props.pd_response;
            if ('pd_data' in $$props) pd_data = $$props.pd_data;
            if ('chart_data' in $$props) chart_data = $$props.chart_data;
            if ('tableHeaders' in $$props) tableHeaders = $$props.tableHeaders;
            if ('cycle' in $$props) cycle = $$props.cycle;
            if ('container' in $$props) $$invalidate(25, container = $$props.container);
            if ('conversationHistory' in $$props) $$invalidate(0, conversationHistory = $$props.conversationHistory);
            if ('isPlaying' in $$props) isPlaying = $$props.isPlaying;
            if ('showConfirm' in $$props) $$invalidate(8, showConfirm = $$props.showConfirm);
            if ('showCheckbox' in $$props) $$invalidate(9, showCheckbox = $$props.showCheckbox);
            if ('showConfirm_ppt' in $$props) $$invalidate(10, showConfirm_ppt = $$props.showConfirm_ppt);
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        $$self.$$.update = () => {
            if ($$self.$$.dirty[0] & /*conversationHistory*/ 1) {
                {
                    const lastEntry = conversationHistory[conversationHistory.length - 1];

                    if (lastEntry && lastEntry.show_chart) {
                        // 异步操作，确保 DOM 更新完成
                        (async () => {
                            await tick();
                            const container = document.getElementById(`chart-container-${lastEntry.id}`);

                            if (container) {
                                renderChart(lastEntry.id, lastEntry.chartData);
                            }
                        })();
                    }
                }
            }
        };

        return [
            conversationHistory,
            trainingData,
            currentView,
            load_questions,
            talk,
            response_timeout,
            mode,
            questionInput,
            showConfirm,
            showCheckbox,
            showConfirm_ppt,
            header,
            toggleMode,
            switchView,
            deleteItem,
            playText,
            startSpeechRecognition,
            handleGenerateSQL,
            handleKeyDown,
            showReportConfirm,
            cancelReport,
            showReportConfirm_ppt,
            cancelReport_ppt,
            generateReport,
            generatePPT,
            container,
            click_handler,
            click_handler_1,
            click_handler_2,
            input_change_handler,
            click_handler_3,
            click_handler_4,
            input_input_handler
        ];
    }

    class App extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1, -1]);

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "App",
                options,
                id: create_fragment.name
            });
        }
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
