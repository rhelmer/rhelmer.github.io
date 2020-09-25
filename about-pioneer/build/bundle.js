
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
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
        flushing = false;
        seen_callbacks.clear();
    }
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
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.25.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const extensionId = "dgomkfddaiaajohfdbbecmnpgfikoibf";

    const dispatchFxEvent = (message) => {};
    const firefox = readable({}, async (set) => {

      chrome.runtime.sendMessage(extensionId, {test: "123"},
      function(response) {
        if ((response && "success" in response && response.success))
          handleError(url);
      });
      const result = {
        enrolled: false,
        activeStudies: [],
        availableStudies: [
          {
            name: "Demo Study",
            icons: {
              32:
                "https://addons.cdn.mozilla.net/user-media/addon_icons/2644/2644632-32.png?modified=4a64e2bc",
              64:
                "https://addons.cdn.mozilla.net/user-media/addon_icons/2644/2644632-64.png?modified=4a64e2bc",
              128:
                "https://addons.cdn.mozilla.net/user-media/addon_icons/2644/2644632-128.png?modified=4a64e2bc",
            },
            schema: 1597266497978,
            authors: {
              url:
                "https://addons.mozilla.org/en-US/firefox/addon/pioneer-v2-example/",
              name: "Pioneer Developers",
            },
            version: "1.0",
            addon_id: "pioneer-v2-example@mozilla.org",
            moreInfo: {
              spec:
                "https://addons.mozilla.org/en-US/firefox/addon/pioneer-v2-example/",
            },
            isDefault: false,
            sourceURI: {
              spec:
                "https://addons.mozilla.org/firefox/downloads/file/3579857/pioneer_v2-1.0-fx.xpi",
            },
            studyType: "extension",
            studyEnded: false,
            description: "Study purpose: Testing Pioneer.",
            privacyPolicy: {
              spec:
                "https://addons.mozilla.org/en-US/firefox/addon/pioneer-v2-example/",
            },
            joinStudyConsent:
              "This study will send an encrypted ping, only when the toolbar icon is clicked.",
            leaveStudyConsent: "This study cannot be re-joined.",
            dataCollectionDetails: ["The date and time"],
            id: "0eb02750-7159-4f09-96ae-5c7cb7424e89",
            last_modified: 1597280277565,
          },
        ],
      };

      set(result);
    });

    /* src/StudyCard.svelte generated by Svelte v3.25.1 */
    const file = "src/StudyCard.svelte";
    const get_description_slot_changes = dirty => ({});
    const get_description_slot_context = ctx => ({});
    const get_icon_slot_changes = dirty => ({});
    const get_icon_slot_context = ctx => ({});
    const get_authors_slot_changes = dirty => ({});
    const get_authors_slot_context = ctx => ({});
    const get_name_slot_changes = dirty => ({});
    const get_name_slot_context = ctx => ({});

    // (48:22) <span class="missing" />
    function fallback_block_3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "missing svelte-8i716l");
    			add_location(span, file, 47, 22, 873);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_3.name,
    		type: "fallback",
    		source: "(48:22) <span class=\\\"missing\\\" />",
    		ctx
    	});

    	return block;
    }

    // (52:25) <span class="missing" />
    function fallback_block_2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "missing svelte-8i716l");
    			add_location(span, file, 51, 25, 963);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_2.name,
    		type: "fallback",
    		source: "(52:25) <span class=\\\"missing\\\" />",
    		ctx
    	});

    	return block;
    }

    // (56:22) <span class="missing" />
    function fallback_block_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "missing svelte-8i716l");
    			add_location(span, file, 55, 22, 1048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(56:22) <span class=\\\"missing\\\" />",
    		ctx
    	});

    	return block;
    }

    // (60:29) <span class="description" />
    function fallback_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "description svelte-8i716l");
    			add_location(span, file, 59, 29, 1147);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(60:29) <span class=\\\"description\\\" />",
    		ctx
    	});

    	return block;
    }

    // (65:4) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Join");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(65:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:54) {#if studyEnrolled}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Leave");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(63:54) {#if studyEnrolled}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let article;
    	let h2;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let t3;
    	let button;
    	let t4;
    	let button_disabled_value;
    	let current;
    	let mounted;
    	let dispose;
    	const name_slot_template = /*#slots*/ ctx[5].name;
    	const name_slot = create_slot(name_slot_template, ctx, /*$$scope*/ ctx[4], get_name_slot_context);
    	const name_slot_or_fallback = name_slot || fallback_block_3(ctx);
    	const authors_slot_template = /*#slots*/ ctx[5].authors;
    	const authors_slot = create_slot(authors_slot_template, ctx, /*$$scope*/ ctx[4], get_authors_slot_context);
    	const authors_slot_or_fallback = authors_slot || fallback_block_2(ctx);
    	const icon_slot_template = /*#slots*/ ctx[5].icon;
    	const icon_slot = create_slot(icon_slot_template, ctx, /*$$scope*/ ctx[4], get_icon_slot_context);
    	const icon_slot_or_fallback = icon_slot || fallback_block_1(ctx);
    	const description_slot_template = /*#slots*/ ctx[5].description;
    	const description_slot = create_slot(description_slot_template, ctx, /*$$scope*/ ctx[4], get_description_slot_context);
    	const description_slot_or_fallback = description_slot || fallback_block(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*studyEnrolled*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			h2 = element("h2");
    			if (name_slot_or_fallback) name_slot_or_fallback.c();
    			t0 = space();
    			div0 = element("div");
    			if (authors_slot_or_fallback) authors_slot_or_fallback.c();
    			t1 = space();
    			div1 = element("div");
    			if (icon_slot_or_fallback) icon_slot_or_fallback.c();
    			t2 = space();
    			div2 = element("div");
    			if (description_slot_or_fallback) description_slot_or_fallback.c();
    			t3 = space();
    			button = element("button");
    			if_block.c();
    			t4 = text(" Study");
    			attr_dev(h2, "class", "svelte-8i716l");
    			add_location(h2, file, 46, 2, 846);
    			attr_dev(div0, "class", "authors svelte-8i716l");
    			add_location(div0, file, 50, 2, 916);
    			attr_dev(div1, "class", "icon");
    			add_location(div1, file, 54, 2, 1007);
    			attr_dev(div2, "class", "description svelte-8i716l");
    			add_location(div2, file, 58, 2, 1092);
    			button.disabled = button_disabled_value = !/*enrolled*/ ctx[0];
    			add_location(button, file, 62, 2, 1195);
    			attr_dev(article, "class", "study-card svelte-8i716l");
    			add_location(article, file, 45, 0, 815);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h2);

    			if (name_slot_or_fallback) {
    				name_slot_or_fallback.m(h2, null);
    			}

    			append_dev(article, t0);
    			append_dev(article, div0);

    			if (authors_slot_or_fallback) {
    				authors_slot_or_fallback.m(div0, null);
    			}

    			append_dev(article, t1);
    			append_dev(article, div1);

    			if (icon_slot_or_fallback) {
    				icon_slot_or_fallback.m(div1, null);
    			}

    			append_dev(article, t2);
    			append_dev(article, div2);

    			if (description_slot_or_fallback) {
    				description_slot_or_fallback.m(div2, null);
    			}

    			append_dev(article, t3);
    			append_dev(article, button);
    			if_block.m(button, null);
    			append_dev(button, t4);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleStudy*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (name_slot) {
    				if (name_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(name_slot, name_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_name_slot_changes, get_name_slot_context);
    				}
    			}

    			if (authors_slot) {
    				if (authors_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(authors_slot, authors_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_authors_slot_changes, get_authors_slot_context);
    				}
    			}

    			if (icon_slot) {
    				if (icon_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(icon_slot, icon_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_icon_slot_changes, get_icon_slot_context);
    				}
    			}

    			if (description_slot) {
    				if (description_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(description_slot, description_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_description_slot_changes, get_description_slot_context);
    				}
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, t4);
    				}
    			}

    			if (!current || dirty & /*enrolled*/ 1 && button_disabled_value !== (button_disabled_value = !/*enrolled*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(name_slot_or_fallback, local);
    			transition_in(authors_slot_or_fallback, local);
    			transition_in(icon_slot_or_fallback, local);
    			transition_in(description_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(name_slot_or_fallback, local);
    			transition_out(authors_slot_or_fallback, local);
    			transition_out(icon_slot_or_fallback, local);
    			transition_out(description_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (name_slot_or_fallback) name_slot_or_fallback.d(detaching);
    			if (authors_slot_or_fallback) authors_slot_or_fallback.d(detaching);
    			if (icon_slot_or_fallback) icon_slot_or_fallback.d(detaching);
    			if (description_slot_or_fallback) description_slot_or_fallback.d(detaching);
    			if_block.d();
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StudyCard", slots, ['name','authors','icon','description']);
    	let { enrolled = false } = $$props;
    	let { studyEnrolled = false } = $$props;
    	let { studyId } = $$props;

    	function toggleStudy() {
    	}

    	const writable_props = ["enrolled", "studyEnrolled", "studyId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StudyCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("enrolled" in $$props) $$invalidate(0, enrolled = $$props.enrolled);
    		if ("studyEnrolled" in $$props) $$invalidate(1, studyEnrolled = $$props.studyEnrolled);
    		if ("studyId" in $$props) $$invalidate(3, studyId = $$props.studyId);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		dispatchFxEvent,
    		enrolled,
    		studyEnrolled,
    		studyId,
    		toggleStudy
    	});

    	$$self.$inject_state = $$props => {
    		if ("enrolled" in $$props) $$invalidate(0, enrolled = $$props.enrolled);
    		if ("studyEnrolled" in $$props) $$invalidate(1, studyEnrolled = $$props.studyEnrolled);
    		if ("studyId" in $$props) $$invalidate(3, studyId = $$props.studyId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [enrolled, studyEnrolled, toggleStudy, studyId, $$scope, slots];
    }

    class StudyCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			enrolled: 0,
    			studyEnrolled: 1,
    			studyId: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StudyCard",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*studyId*/ ctx[3] === undefined && !("studyId" in props)) {
    			console.warn("<StudyCard> was created without expected prop 'studyId'");
    		}
    	}

    	get enrolled() {
    		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enrolled(value) {
    		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get studyEnrolled() {
    		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set studyEnrolled(value) {
    		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get studyId() {
    		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set studyId(value) {
    		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/EnrollmentButton.svelte generated by Svelte v3.25.1 */
    const file$1 = "src/EnrollmentButton.svelte";

    // (14:53) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Join");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(14:53) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:34) {#if enrolled}
    function create_if_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Leave");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:34) {#if enrolled}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*enrolled*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			t = text(" Ion");
    			add_location(button, file$1, 13, 0, 258);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleEnrolled*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, t);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EnrollmentButton", slots, []);
    	let { enrolled = false } = $$props;

    	function toggleEnrolled() {
    	}

    	const writable_props = ["enrolled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EnrollmentButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("enrolled" in $$props) $$invalidate(0, enrolled = $$props.enrolled);
    	};

    	$$self.$capture_state = () => ({
    		dispatchFxEvent,
    		enrolled,
    		toggleEnrolled
    	});

    	$$self.$inject_state = $$props => {
    		if ("enrolled" in $$props) $$invalidate(0, enrolled = $$props.enrolled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [enrolled, toggleEnrolled];
    }

    class EnrollmentButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { enrolled: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EnrollmentButton",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get enrolled() {
    		throw new Error("<EnrollmentButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enrolled(value) {
    		throw new Error("<EnrollmentButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.25.1 */

    const { console: console_1 } = globals;
    const file$2 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (26:2) {#if 'availableStudies' in ion}
    function create_if_block$2(ctx) {
    	let enrollmentbutton;
    	let t;
    	let each_1_anchor;
    	let current;

    	enrollmentbutton = new EnrollmentButton({
    			props: { enrolled: /*ion*/ ctx[0].enrolled },
    			$$inline: true
    		});

    	let each_value = /*ion*/ ctx[0].availableStudies;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			create_component(enrollmentbutton.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(enrollmentbutton, target, anchor);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const enrollmentbutton_changes = {};
    			if (dirty & /*ion*/ 1) enrollmentbutton_changes.enrolled = /*ion*/ ctx[0].enrolled;
    			enrollmentbutton.$set(enrollmentbutton_changes);

    			if (dirty & /*ion*/ 1) {
    				each_value = /*ion*/ ctx[0].availableStudies;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(enrollmentbutton.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(enrollmentbutton.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(enrollmentbutton, detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(26:2) {#if 'availableStudies' in ion}",
    		ctx
    	});

    	return block;
    }

    // (34:8) <span slot="name">
    function create_name_slot(ctx) {
    	let span;
    	let t_value = /*study*/ ctx[2].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "slot", "name");
    			add_location(span, file$2, 33, 8, 790);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ion*/ 1 && t_value !== (t_value = /*study*/ ctx[2].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_name_slot.name,
    		type: "slot",
    		source: "(34:8) <span slot=\\\"name\\\">",
    		ctx
    	});

    	return block;
    }

    // (35:8) <span slot="authors">
    function create_authors_slot(ctx) {
    	let span;
    	let t_value = /*study*/ ctx[2].authors.name + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "slot", "authors");
    			add_location(span, file$2, 34, 8, 836);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ion*/ 1 && t_value !== (t_value = /*study*/ ctx[2].authors.name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_authors_slot.name,
    		type: "slot",
    		source: "(35:8) <span slot=\\\"authors\\\">",
    		ctx
    	});

    	return block;
    }

    // (37:8) <span slot="description">
    function create_description_slot(ctx) {
    	let span;
    	let t_value = /*study*/ ctx[2].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "slot", "description");
    			add_location(span, file$2, 36, 8, 966);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ion*/ 1 && t_value !== (t_value = /*study*/ ctx[2].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_description_slot.name,
    		type: "slot",
    		source: "(37:8) <span slot=\\\"description\\\">",
    		ctx
    	});

    	return block;
    }

    // (30:6) <StudyCard         studyId={study.addon_id}         enrolled={ion.enrolled}         studyEnrolled={ion.activeStudies.includes(study.addon_id)}>
    function create_default_slot(ctx) {
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    			t2 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(30:6) <StudyCard         studyId={study.addon_id}         enrolled={ion.enrolled}         studyEnrolled={ion.activeStudies.includes(study.addon_id)}>",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#each ion.availableStudies as study}
    function create_each_block(ctx) {
    	let studycard;
    	let current;

    	studycard = new StudyCard({
    			props: {
    				studyId: /*study*/ ctx[2].addon_id,
    				enrolled: /*ion*/ ctx[0].enrolled,
    				studyEnrolled: /*ion*/ ctx[0].activeStudies.includes(/*study*/ ctx[2].addon_id),
    				$$slots: {
    					default: [create_default_slot],
    					description: [create_description_slot],
    					authors: [create_authors_slot],
    					name: [create_name_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(studycard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(studycard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const studycard_changes = {};
    			if (dirty & /*ion*/ 1) studycard_changes.studyId = /*study*/ ctx[2].addon_id;
    			if (dirty & /*ion*/ 1) studycard_changes.enrolled = /*ion*/ ctx[0].enrolled;
    			if (dirty & /*ion*/ 1) studycard_changes.studyEnrolled = /*ion*/ ctx[0].activeStudies.includes(/*study*/ ctx[2].addon_id);

    			if (dirty & /*$$scope, ion*/ 33) {
    				studycard_changes.$$scope = { dirty, ctx };
    			}

    			studycard.$set(studycard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(studycard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(studycard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(studycard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(29:4) {#each ion.availableStudies as study}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let current;
    	let if_block = "availableStudies" in /*ion*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "svelte-ipu353");
    			add_location(main, file$2, 24, 0, 499);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ("availableStudies" in /*ion*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*ion*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let ion;
    	const unsubscribe = firefox.subscribe(value => $$invalidate(0, ion = value));
    	onDestroy(unsubscribe);
    	console.debug(ion);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		firefox,
    		dispatchFxEvent,
    		onDestroy,
    		StudyCard,
    		EnrollmentButton,
    		ion,
    		unsubscribe
    	});

    	$$self.$inject_state = $$props => {
    		if ("ion" in $$props) $$invalidate(0, ion = $$props.ion);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ion];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
