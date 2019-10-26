class EntityOrder {

    // Apparently that's how we do consts inside classes...
    static get ORDER_MUL() {
	return 100000;
    }

    // Compare entities
    static cmpEntities(a, b) {
	let order_a = a.getFlag("entityorder", "order");
	let order_b = b.getFlag("entityorder", "order");
	if (order_a === undefined) {
	    order_a = a.collection.entities.indexOf(a) * EntityOrder.ORDER_MUL;
	    a.setFlag("entityorder", "order", order_a);
	}
	if (order_b === undefined) {
	    order_b = b.collection.entities.indexOf(b) * EntityOrder.ORDER_MUL;
	    b.setFlag("entityorder", "order", order_b);
	}
	return order_a - order_b;
    }

    // Replacement to setupFolder that sorts the folders and entities before returning the result
    static setupFolders(folders, entities) {
	folders = folders.sort((a, b) => a.data.sort - b.data.sort)
	let sorted_entities = entities.sort(EntityOrder.cmpEntities);
	return this._entityorder_original_setupFolders(folders, sorted_entities);
    }

    static _onFolderDragStart(obj, event) {
	event.stopPropagation();
	let li = $(event.currentTarget);
	if (!li.hasClass("folder")) li = li.parents(".folder");
	let folderId = li.attr("data-folder-id");
	event.dataTransfer.setData("text/plain", JSON.stringify({
	    type: obj.constructor.entity + "Folder",
	    id: folderId
	}));
    }

    static _onDrop(event) {
	// Try to extract the data
	let data;
	try {
	    data = JSON.parse(event.dataTransfer.getData('text/plain'));
	} catch (err) {
	    return this._entityorder_original_onDrop(event)
	}

	if (data.type.endsWith("Folder")) {
	    event.preventDefault();
	    if (data.type !== this.constructor.entity + "Folder")
		return false;

	    // Call the drop handler
	    return EntityOrder._handleFolderDropData(this, event, data);
	} else {
	    return this._entityorder_original_onDrop(event)
	}
    }

    static _handleFolderDropData(sidebar, event, data) {
	let folder = game.folders.get(data.id);

	if (folder == undefined)
	    return false;

	let sibling = null
	let closest = $(event.target).closest(".folder");
	if (closest.length > 0) {
	    let sibling_id = closest.attr("data-folder-id");
	    sibling = game.data.folders.find(f => f._id == sibling_id);
	}
	let parent_id = sibling ? sibling.parent : null
	let sibling_folders = game.data.folders.filter(f => f.type == sidebar.constructor.entity && f.parent == parent_id);
	sibling_folders = sibling_folders.sort((a, b) => a.sort - b.sort)
	let last_order = sibling_folders.length > 0 ? sibling_folders[sibling_folders.length - 1].sort : 0
	let previous_order = sibling ? sibling.sort : last_order
	let next_order = previous_order + 2 * EntityOrder.ORDER_MUL;
	if (sibling) {
	    let idx = sibling_folders.indexOf(sibling)
	    if (idx + 1 < sibling_folders.length)
		next_order = sibling_folders[idx + 1].sort
	}
	let new_order = parseInt(previous_order + next_order) / 2
	folder.update({ "parent": parent_id, "sort": new_order })
	return false;
    }

    static _handleDropData(event, data) {
	let before = $(event.target).closest(".directory-item");
	let after = $(event.target).next(".directory-item");
	let ent = this.constructor.collection.get(data.id);
	if (ent == undefined) {
	    //console.log("Dropped unknown entity.")
	    return this._entityorder_original_handleDropData(event, data)
	}

	//console.log("Dropped before ", before, " and after ", after)
	let folder = $(event.target).closest(".folder");
	let new_order = EntityOrder.ORDER_MUL
	let folder_id = null;
	if (folder.length > 0) {
	    folder_id = folder.attr("data-folder-id");
	}
	if (before.length != 0 && after.length == 0) {
	    after = before.next(".directory-item")
	}
	if (before.length == 0 && after.length == 0) {
	    let children = folder.find(".directory-item")
	    // Added to the beginning of the folder
	    if (children.length == 0) {
		new_order = EntityOrder.ORDER_MUL
	    } else {
		after = $(children[0])
		let after_ent = this.constructor.collection.get(after.attr("data-entity-id"))
		new_order = after_ent.getFlag("entityorder", "order") / 2
	    }
	} else if (before.length != 0 && after.length == 0) {
	    let before_ent = this.constructor.collection.get(before.attr("data-entity-id"))

	    // Added to the end of a folder
	    new_order = before_ent.getFlag("entityorder", "order") + EntityOrder.ORDER_MUL
	} else if (before.length == 0 && after.length != 0) {
	    let after_ent = this.constructor.collection.get(after.attr("data-entity-id"))

	    // Added between the folder and its first element
	    new_order = after_ent.getFlag("entityorder", "order") / 2
	} else {
	    let before_ent = this.constructor.collection.get(before.attr("data-entity-id"))
	    let after_ent = this.constructor.collection.get(after.attr("data-entity-id"))

	    // Added in between
	    new_order = (before_ent.getFlag("entityorder", "order") + after_ent.getFlag("entityorder", "order")) / 2
	}
	//console.log("New order = ", new_order)
	// TODO: Re-order the list if the new_order has become a float (Number.isInteger() == false)
	let promise = ent.setFlag("entityorder", "order", new_order);
	// If different folder, then it will already get re-rendered
	if (ent.data.folder == folder_id) {
	    promise.then(() => ent.collection.render())
	}
	this._scrollTop = $(event.target).closest(".directory-list").scrollTop()
	return this._entityorder_original_handleDropData(event, data)
    }


    static directoryRendered(obj, html, data) {
	if (obj._scrollTop) obj.element.find(".directory-list").scrollTop(obj._scrollTop)
	delete obj._scrollTop
	// Make folders draggable
	html.find("li.folder").each((i, li) => {
	    li.setAttribute("draggable", true);
	    li.addEventListener('dragstart', ev => EntityOrder._onFolderDragStart(obj, ev), false);
	});
    }

    static getEntityFolderContext(html, options) {
	options.push({
	    name: "Sort Alphabetically",
	    icon: '<i class="fas fa-sort-alpha-down"></i>',
	    condition: game.user.isGM,
	    callback: header => {
		let folderId = header.parent().attr("data-folder-id");
		let folder = game.folders.get(folderId);
		let entities = folder.content;
		let collection = folder.entityCollection;

		// Reset order values according to the new order within this folder
		// This won't affect the order with the other folders and the whole collection
		// order will be reset on the next render
		let sorted_entities = entities.sort((a, b) => a.data.name.localeCompare(b.data.name))
		let promises = EntityOrder.reorderEntities(sorted_entities)
		if (collection && !isNewerVersion(game.data.version, "0.3.8")) {
		    collection._scrollTop = html.find(".directory-list").scrollTop()
		    Promise.all(promises).then(() => collection.render());
		}
	    }
	})
    }


    // Re-order the entire list based on their position. Only used when we've run out of integers for
    // our sorting values or when sorting alphabetically.
    static reorderEntities(entities) {
	let promises = []
	for (let i = 0; i < entities.length; i++) {
	    let order = i * EntityOrder.ORDER_MUL;
	    let promise = null;
	    if (isNewerVersion(game.data.version, "0.3.8")) {
		promise = entities[i].update({sort: order});
	    } else {
		promise = entities[i].setFlag("entityorder", "order", order);
	    }
	    promises.push(promise);
	}
	return promises;
    }
    // Clean folder names by removing the "•order•name" from the name as it used to be
    // and use the new 'sort' field introduced in 0.3.2
    static cleanFolderName(folder) {
	let match = folder.name.match(/^•([0-9]+)•(.+)/, "");
	if (match) {
	    let order = parseInt("0" + match[1]) * EntityOrder.ORDER_MUL;
	    return folder.update({ "name": match[2], "sort": order });
	}
	return Promise.resolve(folder);
    }
    // Use the new 'sort' field for all entities that was introduced in 0.3.9
    static migrateToCoreSort(entity) {
	let order = entity.getFlag("entityorder", "order")
	if (order !== undefined && order !== null) {
	    if (EntityOrder.migratingWarning !== true) {
		// Show warning if we find that we need to migrate stuff.
		// This can take quite a while since most probably every entity needs a database upgrade.
		// Show the warning every 5 seconds until we stop migrating.
		EntityOrder.migratingWarning = true;
		console.warn("Migrating sort order from module to core sort key")
		ui.notifications.warn("EntityOrder: Migrating sort order from module to core sort key.<p>Please be patient as this may take a while... This message will disappear when the migration is done.</p>")
		setTimeout(() => EntityOrder.migratingWarning = false, 5000)
	    }
	    return entity.update({sort: order, "flags.entityorder.order": null})
	}
	return Promise.resolve(entity);
    }   
    static async migrate() {
	// Let's clean the folder names here and let it redraw if needed.
	for (let folder of game.folders.entities)
	    await EntityOrder.cleanFolderName(folder).catch(() => {});

	if (isNewerVersion(game.data.version, "0.3.8")) {
	    let all_entities = game.journal.entities.concat(game.scenes.entities).concat(game.actors.entities).concat(game.items.entities)
	    for (let entity of all_entities)
		await EntityOrder.migrateToCoreSort(entity).catch(() => {});
	}
    } 
    static init() {
	if (!isNewerVersion(game.data.version, "0.3.8")) {
	    // Need to do this on init to avoid conflict with infinite_folders module
	    SidebarDirectory._entityorder_original_setupFolders = SidebarDirectory.setupFolders;
	    SidebarDirectory.setupFolders = EntityOrder.setupFolders
	    SidebarDirectory.prototype._entityorder_original_onDrop = SidebarDirectory.prototype._onDrop;
	    SidebarDirectory.prototype._onDrop = EntityOrder._onDrop
	    SidebarDirectory.prototype._entityorder_original_handleDropData = SidebarDirectory.prototype._handleDropData;
	    SidebarDirectory.prototype._handleDropData = EntityOrder._handleDropData

	    Hooks.on('renderJournalDirectory', EntityOrder.directoryRendered)
	    Hooks.on('renderSceneDirectory', EntityOrder.directoryRendered)
	    Hooks.on('renderActorDirectory', EntityOrder.directoryRendered)
	    Hooks.on('renderItemDirectory', EntityOrder.directoryRendered)

	}
    }
}

Hooks.on('init', EntityOrder.init)
Hooks.on('ready', EntityOrder.migrate)
/* Even if on 0.3.9, we still want the sort alphabetically option */
Hooks.on('getJournalDirectoryFolderContext', EntityOrder.getEntityFolderContext);
Hooks.on('getSceneDirectoryFolderContext', EntityOrder.getEntityFolderContext);
Hooks.on('getActorDirectoryFolderContext', EntityOrder.getEntityFolderContext);
Hooks.on('getItemDirectoryFolderContext', EntityOrder.getEntityFolderContext);
