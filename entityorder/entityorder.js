function ensureOrder(entity) {
    let order = entity.getFlag("entityorder", "order");
    if (order === undefined) {
	entity.setFlag("entityorder", "order", entity.collection.entities.indexOf(entity))
    }
}
function cmpEntities(a, b) {
    let order_a = a.getFlag("entityorder", "order");
    let order_b = b.getFlag("entityorder", "order");
    return order_a - order_b;
}

function cleanFolderName(folder) {
    folder.name = folder.name.replace(/^•[0-9]+•/, "")
    if (folder.children != undefined) {
	folder.children.forEach(cleanFolderName);
    }
}

function entityorder_setupFolders(entityType, entities) {
    entities.forEach(ensureOrder)
    sorted_entities = entities.sort(cmpEntities)
    // Reset order values so it doesn't continuously get divided into floating values if we re-order often
    for (let i = 0; i < sorted_entities.length; i++) {
	sorted_entities[i].setFlag("entityorder", "order", i)
    }
    let [tree, root_entities] = this._entityorder_original_setupFolders(entityType, sorted_entities);
    tree.forEach(cleanFolderName)
    return [tree, root_entities]
}

function entityorder_handleDropData(event, data) {
    let before = $(event.target).closest(".directory-item");
    let after = $(event.target).next(".directory-item");
    let ent = this.constructor.collection.get(data.id);
    if (ent == undefined) {
	//console.log("Dropped unknown entity.")
	return this._entityorder_original_handleDropData(event, data)
    }

    //console.log("Dropped before ", before, " and after ", after)
    folder = $(event.target).closest(".folder");
    if ( folder.length > 0 ) {
	folder_id = folder.attr("data-folder-id");
    } else {
	folder_id = null;
    }
    var new_order = ""
    if (before.length != 0 && after.length == 0) {
	after = before.next(".directory-item")
    }
    if (before.length == 0 && after.length == 0) {
	children = folder.find(".directory-item")
	// Added to the beginning of the folder
	if (children.length == 0) {
	    new_order = 0
	} else {
	    after = $(children[0])
	    let after_ent = this.constructor.collection.get(after.attr("data-entity-id"))
	    new_order = after_ent.getFlag("entityorder", "order") -1
	}
    } else if (before.length != 0 && after.length == 0) {
	let before_ent = this.constructor.collection.get(before.attr("data-entity-id"))
	
	// Added to the end of a folder
	new_order = before_ent.getFlag("entityorder", "order") + 1
    } else if (before.length == 0 && after.length != 0) {
	let after_ent = this.constructor.collection.get(after.attr("data-entity-id"))
	
	// Added between the folder and its first element
	new_order = after_ent.getFlag("entityorder", "order") -1
    } else {
	let before_ent = this.constructor.collection.get(before.attr("data-entity-id"))
	let after_ent = this.constructor.collection.get(after.attr("data-entity-id"))
	
	// Added in between
	new_order = (before_ent.getFlag("entityorder", "order") + after_ent.getFlag("entityorder", "order")) / 2
    }
    //console.log("New order = ", new_order)
    ent.setFlag("entityorder", "order", new_order);
    if (ent.data.folder != folder_id) {
	//console.log("Folder is going to get updated from ", ent.data.folder, " to " , folder_id);
	//ent.setFlag("entityorder", "order", "");
    } else {
	this.constructor.collection._pendingRender = true
    }
    this._scrollTop = $(event.target).closest(".directory-list").scrollTop()
    return this._entityorder_original_handleDropData(event, data)
}

function entityUpdated(obj) {
    if (obj.collection._pendingRender) {
	obj.collection.render()
    }
    obj.collection._pendingRender = false
}

function directoryRendered(obj, html, data) {
    if (obj._scrollTop) obj.element.find(".directory-list").scrollTop(obj._scrollTop)
    delete obj._scrollTop
}

Hooks.on('updateJournalEntry', entityUpdated)
Hooks.on('updateScene', entityUpdated)
Hooks.on('updateActor', entityUpdated)
Hooks.on('updateItem', entityUpdated)

Hooks.on('renderJournalDirectory', directoryRendered)
Hooks.on('renderSceneDirectory', directoryRendered)
Hooks.on('renderActorDirectory', directoryRendered)
Hooks.on('renderItemDirectory', directoryRendered)
Hooks.on('init', function() {
    // Need to do this on init to avoid conflict with infinite_folders module
    Folder._entityorder_original_setupFolders = Folder.setupFolders;
    Folder.setupFolders = entityorder_setupFolders
    SidebarDirectory.prototype._entityorder_original_handleDropData = SidebarDirectory.prototype._handleDropData;
    SidebarDirectory.prototype._handleDropData = entityorder_handleDropData
})
